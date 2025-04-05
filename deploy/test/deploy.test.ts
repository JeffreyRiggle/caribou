import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Deploy from '../lib/deploy-caribou-stack';

test('Caribou created', () => {
   const app = new cdk.App();
   const stack = new Deploy.DeployStack(app, 'MyTestStack');
   const template = Template.fromStack(stack);

   template.hasResource('AWS::ECR::Repository', {});
});
