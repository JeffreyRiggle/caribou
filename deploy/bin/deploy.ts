#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DeployStack } from '../lib/deploy-caribou-stack';

const app = new cdk.App();
new DeployStack(app, 'DeployCaribouStack', {
});