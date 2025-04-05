import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrdeploy from 'cdk-ecr-deployment';
import * as path from "path";
import { ArnPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class DeployStack extends cdk.Stack {
  private containerRepository: Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.buildContainerRepository();
    this.buildAdminContainer();
    this.buildCrawlerContainer();
    this.buildGrepperContainer();

    // vpc
    // const vpc = new Vpc(this, 'CaribouAdminVPC', {
    //   ipAddresses: IpAddresses.cidr('10.0.0.0/16')
    // });

    // const adminCluster = new Cluster(this, 'CaribouAdminCluster', {
    //   vpc
    // });

    // const admin = new Ec2TaskDefinition(this, 'AdminTaskDefinition');
    // admin.addContainer('AdminContainer', {
    //   image: 
    // })
    // postgres
    // ecs or eks with admin and crawler
    // ecs or eks with grepper
  }

  private buildContainerRepository() {
    this.containerRepository = new Repository(this, 'CaribouRegistry', {
      repositoryName: 'caribou-image-assets',
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
}
