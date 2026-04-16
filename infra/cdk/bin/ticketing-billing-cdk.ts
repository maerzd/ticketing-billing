#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BillingDynamoStack } from "../lib/billing-dynamo-stack";
import { VercelOidcStack } from "../lib/vercel-oidc-stack";

const app = new cdk.App();

const env = {
	account: process.env.CDK_DEFAULT_ACCOUNT,
	region: process.env.CDK_DEFAULT_REGION,
};

new BillingDynamoStack(app, "BillingDynamoStack", {
	env,
	description: "DynamoDB infrastructure for ticketing billing automation",
});

new VercelOidcStack(app, "VercelOidcStack", {
	env,
	description: "Vercel OIDC provider and IAM role for DynamoDB access",
});
