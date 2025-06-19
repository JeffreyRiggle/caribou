import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from "path";
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { DockerImageCode } from 'aws-cdk-lib/aws-lambda';
import { createHash } from 'crypto';
import { AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Credentials, DatabaseSecret } from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Size } from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class DeployStack extends cdk.Stack {
  private vpc: ec2.Vpc;
  private adminImage: DockerImageAsset;
  private crawlerImage: DockerImageAsset;
  private grepperImage: DockerImageAsset;
  private dbSecret: DatabaseSecret;
  private dbServer: rds.DatabaseInstance;
  private adminService: ecs.FargateService;
  private grepperService: ecs.FargateService;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.buildAdminContainer();
    this.buildCrawlerContainer();
    this.buildGrepperContainer();
    this.buildVPC();
    // this.deployPostgres();
    this.deployApps();
    this.deployLoadBalancer();
  }

  private buildAdminContainer() {
    this.adminImage = new DockerImageAsset(this, 'CaribouAdminImage', {
      directory: path.join(__dirname, '../..'),
      file: './admin/Dockerfile',
      platform: Platform.LINUX_ARM64
    });
  }

  private buildCrawlerContainer() {
    this.crawlerImage = new DockerImageAsset(this, 'CaribouCrawlerImage', {
      directory: path.join(__dirname, '../..'),
      file: './crawler/Dockerfile',
      platform: Platform.LINUX_ARM64
    });
  }

  private buildGrepperContainer() {
    this.grepperImage = new DockerImageAsset(this, 'CaribouGrepperImage', {
      directory: path.join(__dirname, '../..'),
      file: './grepper/Dockerfile',
      platform: Platform.LINUX_ARM64
    });
  }

  private buildVPC() {
    this.vpc = new ec2.Vpc(this, 'CaribouAdminVPC', {
       ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });
  }

  private deployPostgres() {
    this.dbSecret = new DatabaseSecret(this, 'CaribouDatabaseCredentials', {
      secretName: 'CaribouPostgresSecrets',
      username: 'postgres'
    });

    this.dbServer = new rds.DatabaseInstance(this, 'CaribouPostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_17_4 }),
      vpc: this.vpc,
      credentials: Credentials.fromSecret(this.dbSecret),
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

    this.dbSecret.grantRead(databaseInitializer);

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

    customResource.node.addDependency(this.dbServer);

    this.dbServer.connections.allowFrom(databaseInitializer, ec2.Port.tcp(5432));

    new cdk.CfnOutput(this, 'RdsInitFnResponse', {
      value: cdk.Token.asString(response)
    });
  }

  private deployApps() {
    const cluster = new ecs.Cluster(this, 'CaribouCluster', {
      vpc: this.vpc
    });

    //cluster.node.addDependency(this.dbServer);

    cluster.addCapacity('DefaultAutoScalingGroupCapacity', {
      instanceType: new ec2.InstanceType("t3.medium"),
      machineImage: ecs.EcsOptimizedImage.amazonLinux()
    });

    //const dbDetails = this.dbSecret.secretValue.toJSON();
    //const dbConnectionString = `host='${dbDetails.host}' port=5432 user='${dbDetails.username}' password='${dbDetails.password}'`;

    const adminTaskDefinition = new ecs.FargateTaskDefinition(this, 'CaribouTaskDef', {
      memoryLimitMiB: 4096,
      cpu: 2048
    });
    const grepperTaskDefinition = new ecs.FargateTaskDefinition(this, 'GrepperTaskDef', {
      memoryLimitMiB: 512
    });
    const volume = new ecs.ServiceManagedVolume(this, 'CaribouFiles', {
      name: 'CaribouFiles',
      managedEBSVolume: {
        size: Size.gibibytes(15),
        volumeType: ec2.EbsDeviceVolumeType.GP3,
        fileSystemType: ecs.FileSystemType.XFS
      },
    });
    adminTaskDefinition.addVolume(volume);
    grepperTaskDefinition.addVolume(volume);

    const adminContainer = adminTaskDefinition.addContainer('AdminContainer', {
      image: ecs.ContainerImage.fromDockerImageAsset(this.adminImage),
      memoryLimitMiB: 512,
      portMappings: [{ containerPort: 8080 }],
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'admin-container-logs'
      }),
      environment: {
        // USE_POSTGRES: 'true',
        // DB_CONNECTION_STRING: dbConnectionString,
        CRAWLER_ENDPOINT: 'http://127.0.0.1:5001',
        SQLITE_FILE: '/usr/src/data/grepper.db'
      },
    });

    volume.mountIn(adminContainer, {
      containerPath: '/usr/src/data',
      readOnly: false
    });

    const crawlerContainer = adminTaskDefinition.addContainer('CrawlerContainer', {
      image: ecs.ContainerImage.fromDockerImageAsset(this.crawlerImage),
      memoryLimitMiB: 1024,
      portMappings: [{ containerPort: 5001 }],
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'crawler-container-logs'
      }),
      environment: {
        //USE_POSTGRES: 'true',
        //DB_CONNECTION_STRING: dbConnectionString,
        CONTENT_PATH: '/usr/src/data/contents',
        SQLITE_FILE: '/usr/src/data/grepper.db'
      },
    });

    const grepperContainer = grepperTaskDefinition.addContainer('GrepperContainer', {
      image: ecs.ContainerImage.fromDockerImageAsset(this.grepperImage),
      memoryLimitMiB: 512,
      portMappings: [{ containerPort: 4080 }],
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'grepper-container-logs'
      }),
      environment: {
        //USE_POSTGRES: 'true',
        //DB_CONNECTION_STRING: dbConnectionString,
        CONTENT_PATH: '/usr/src/data/contents',
        SQLITE_FILE: '/usr/src/data/grepper.db'
      },
    });

    volume.mountIn(crawlerContainer, {
      containerPath: '/usr/src/data',
      readOnly: false
    });
    volume.mountIn(grepperContainer, {
      containerPath: '/usr/src/data',
      readOnly: false
    });

    this.adminService = new ecs.FargateService(this, 'AdminService', {
      cluster,
      taskDefinition: adminTaskDefinition,
      desiredCount: 1,
      minHealthyPercent: 100,
    });

    this.adminService.addVolume(volume);

    this.grepperService = new ecs.FargateService(this, 'GrepperService', {
      cluster,
      taskDefinition: grepperTaskDefinition,
      desiredCount: 1,
      minHealthyPercent: 100,
    });

    this.grepperService.addVolume(volume);
  }

  private deployLoadBalancer() {
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'CaribouALB', {
      vpc: this.vpc,
      internetFacing: true,
    });

    const adminListener = loadBalancer.addListener('AdminListener', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP
    });

    const adminTargetGroup = adminListener.addTargets('AdminTargettingGroup', {
      port: 8080,
      targets: [this.adminService],
      protocol: elbv2.ApplicationProtocol.HTTP
    });

    const grepperListener = loadBalancer.addListener('GrepperListener', {
      port: 4080,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    const grepperTargetGroup = grepperListener.addTargets('GrepperTargettingGroup', {
      port: 4080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.grepperService]
    });

    // Output the ALB DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
    });
  }
}
