import * as cdk from "aws-cdk-lib";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

const VERCEL_TEAM_SLUG = "zuenftick";
const VERCEL_PROJECT_NAME = "ticketing-billing";
const VERCEL_OIDC_ISSUER = `https://oidc.vercel.com/${VERCEL_TEAM_SLUG}`;
const VERCEL_AUDIENCE = `https://vercel.com/${VERCEL_TEAM_SLUG}`;
const VERCEL_CONDITION_KEY_PREFIX = `oidc.vercel.com/${VERCEL_TEAM_SLUG}`;

interface VercelOidcStackProps extends cdk.StackProps {
	organizersTable: Table;
	billingRecordsTable: Table;
}

export class VercelOidcStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: VercelOidcStackProps) {
		super(scope, id, props);

		const oidcProvider = new iam.OpenIdConnectProvider(
			this,
			"VercelOidcProvider",
			{
				url: VERCEL_OIDC_ISSUER,
				clientIds: [VERCEL_AUDIENCE],
			},
		);

		const role = new iam.Role(this, "VercelDeploymentRole", {
			roleName: "VercelDeploymentRole",
			assumedBy: new iam.WebIdentityPrincipal(
				oidcProvider.openIdConnectProviderArn,
				{
					StringEquals: {
						[`${VERCEL_CONDITION_KEY_PREFIX}:aud`]: VERCEL_AUDIENCE,
					},
					StringLike: {
						[`${VERCEL_CONDITION_KEY_PREFIX}:sub`]: `owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:*`,
					},
				},
			),
			description: `Assumed by Vercel project ${VERCEL_PROJECT_NAME} via OIDC`,
		});

		props.organizersTable.grantReadWriteData(role);
		props.billingRecordsTable.grantReadWriteData(role);

		new cdk.CfnOutput(this, "VercelDeploymentRoleArn", {
			value: role.roleArn,
			exportName: "VercelDeploymentRoleArn",
			description:
				"Set this as AWS_ROLE_ARN in your Vercel project environment variables",
		});
	}
}
