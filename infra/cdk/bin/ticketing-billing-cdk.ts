#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BillingDynamoStack } from "../lib/billing-dynamo-stack";

const app = new cdk.App();

new BillingDynamoStack(app, "BillingDynamoStack", {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEFAULT_REGION,
	},
	description: "DynamoDB infrastructure for ticketing billing automation",
});
