import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrdeploy from 'cdk-ecr-deployment';
import * as path from "path";
import { ArnPrincipal, Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { DockerImageCode } from 'aws-cdk-lib/aws-lambda';
import { createHash } from 'crypto';
import { AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Credentials, DatabaseSecret } from 'aws-cdk-lib/aws-rds';

export class DeployStack extends cdk.Stack {
  private containerRepository: Repository;
  private vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.buildContainerRepository();
    this.buildAdminContainer();
    this.buildCrawlerContainer();
    this.buildGrepperContainer();
    this.buildVPC();
    this.deployPostgres();

    // const adminCluster = new Cluster(this, 'CaribouAdminCluster', {
    //   vpc
    // });

    // const admin = new Ec2TaskDefinition(this, 'AdminTaskDefinition');
    // admin.addContainer('AdminContainer', {
    //   image: 
    // })
    // ecs or eks with admin and crawler
    // ecs or eks with grepper
  }

  private buildContainerRepository() {
    this.containerRepository = new Repository(this, 'CaribouRegistry', {
      repositoryName: 'caribou-image-assets',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true
    });

    const accountId = process.env.CDK_DEFAULT_ACCOUNT;
    const accountPrincipal = new ArnPrincipal(`arn:aws:iam::${accountId}:root`);
    this.containerRepository.addToResourcePolicy(new PolicyStatement({
      sid: 'AllowCrossAccountPull',
      effect: Effect.ALLOW,
      actions: [
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchCheckLayerAvailability',
        'ecr:BatchGetImage'
      ],
      principals: [ accountPrincipal ]
    }));
    this.containerRepository.grantPull(accountPrincipal);
  }

  private buildAdminContainer() {
    const adminContainerAsset = new DockerImageAsset(this, 'CaribouAdminImage', {
      directory: path.join(__dirname, '../..'),
      file: './admin/Dockerfile',
    });

    const adminImageDeploy = new ecrdeploy.ECRDeployment(this, 'DeployCaribouAdminImage', {
      src: new ecrdeploy.DockerImageName(adminContainerAsset.imageUri),
      dest: new ecrdeploy.DockerImageName(`${this.containerRepository.repositoryUri}:${adminContainerAsset.assetHash}`),
    });
  }

  private buildCrawlerContainer() {
    const crawlerContainerAsset = new DockerImageAsset(this, 'CaribouCrawlerImage', {
      directory: path.join(__dirname, '../..'),
      file: './crawler/Dockerfile',
    });

    const crawlerImageDeploy = new ecrdeploy.ECRDeployment(this, 'DeployCaribouCrawlerImage', {
      src: new ecrdeploy.DockerImageName(crawlerContainerAsset.imageUri),
      dest: new ecrdeploy.DockerImageName(`${this.containerRepository.repositoryUri}:${crawlerContainerAsset.assetHash}`),
    });
  }

  private buildGrepperContainer() {
    const grepperContainerAsset = new DockerImageAsset(this, 'CaribouGrepperImage', {
      directory: path.join(__dirname, '../..'),
      file: './grepper/Dockerfile',
    });

    const grepperImageDeploy = new ecrdeploy.ECRDeployment(this, 'DeployCaribouGrepperImage', {
      src: new ecrdeploy.DockerImageName(grepperContainerAsset.imageUri),
      dest: new ecrdeploy.DockerImageName(`${this.containerRepository.repositoryUri}:${grepperContainerAsset.assetHash}`),
    });
  }

  private buildVPC() {
    this.vpc = new ec2.Vpc(this, 'CaribouAdminVPC', {
       ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });
  }

  private deployPostgres() {
    const databaseCreds = new DatabaseSecret(this, 'CaribouDatabaseCredentials', {
      secretName: 'CaribouPostgresSecrets',
      username: 'postgres'
    });

    const dbServer = new rds.DatabaseInstance(this, 'CaribouPostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_17_4 }),
      vpc: this.vpc,
      credentials: Credentials.fromSecret(databaseCreds),
      instanceType: new ec2.InstanceType('t4g.micro'),
      databaseName: 'caribou'
    });

    const databaseInitializer = new lambda.DockerImageFunction(this, 'ResourceInitializerFn', {
      memorySize: 128,
      functionName: `CaribouPostgres-ResInit${this.stackName}`,
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '../..'), {
        file: './deploy/initializers/postgres-initializer/Dockerfile'
      }),
      vpc: this.vpc,
      timeout: cdk.Duration.minutes(2),
      allowAllOutbound: true
    });

    databaseCreds.grantRead(databaseInitializer);

    const payload: string = JSON.stringify({
      params: {
        config: {
          secretName: 'CaribouPostgresSecrets'
        }
      }
    });

    const payloadHashPrefix = createHash('md5').update(payload).digest('hex').substring(0, 6);

    const sdkCall: AwsSdkCall = {
      service: 'Lambda',
      action: 'invoke',
      parameters: {
        FunctionName: databaseInitializer.functionName,
        Payload: payload
      },
      physicalResourceId: PhysicalResourceId.of(`$CaribouPostgresInitializer-AwsSdkCall-${databaseInitializer.currentVersion.version + payloadHashPrefix}`)
    };
    
    const customResourceFnRole = new Role(this, 'AwsCustomResourceRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });

    customResourceFnRole.addToPolicy(
      new PolicyStatement({
        resources: [`arn:aws:lambda:${this.region}:${this.account}:function:*-ResInit${this.stackName}`],
        actions: ['lambda:InvokeFunction']
      })
    );

    const customResource = new AwsCustomResource(this, 'AwsCustomResource', {
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
      onUpdate: sdkCall,
      timeout: cdk.Duration.minutes(10),
      role: customResourceFnRole
    });

    const response = customResource.getResponseField('Payload');

    customResource.node.addDependency(dbServer);

    dbServer.connections.allowFrom(databaseInitializer, ec2.Port.tcp(5432));

    new cdk.CfnOutput(this, 'RdsInitFnResponse', {
      value: cdk.Token.asString(response)
    });
  }
}
