import * as cdk from "aws-cdk-lib";
import {
	AttributeType,
	BillingMode,
	Table,
	TableEncryption,
} from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export class BillingDynamoStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const organizersTable = new Table(this, "OrganizersTable", {
			partitionKey: {
				name: "organizerId",
				type: AttributeType.STRING,
			},
			billingMode: BillingMode.PAY_PER_REQUEST,
			pointInTimeRecoverySpecification: {
				pointInTimeRecoveryEnabled: true,
			},
			encryption: TableEncryption.AWS_MANAGED,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const billingRecordsTable = new Table(this, "BillingRecordsTable", {
			partitionKey: {
				name: "organizerId",
				type: AttributeType.STRING,
			},
			sortKey: {
				name: "eventid",
				type: AttributeType.STRING,
			},
			billingMode: BillingMode.PAY_PER_REQUEST,
			pointInTimeRecoverySpecification: {
				pointInTimeRecoveryEnabled: true,
			},
			encryption: TableEncryption.AWS_MANAGED,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		billingRecordsTable.addGlobalSecondaryIndex({
			indexName: "StatusIndex",
			partitionKey: {
				name: "status",
				type: AttributeType.STRING,
			},
			sortKey: {
				name: "triggered_at",
				type: AttributeType.STRING,
			},
			projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
		});

		billingRecordsTable.addGlobalSecondaryIndex({
			indexName: "EventIndex",
			partitionKey: {
				name: "eventid",
				type: AttributeType.STRING,
			},
			projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
		});

		new cdk.CfnOutput(this, "OrganizersTableName", {
			value: organizersTable.tableName,
			exportName: "OrganizersTableName",
		});

		new cdk.CfnOutput(this, "BillingRecordsTableName", {
			value: billingRecordsTable.tableName,
			exportName: "BillingRecordsTableName",
		});

		new cdk.CfnOutput(this, "DynamoDbOrganizersEnvVar", {
			value: "DYNAMODB_ORGANIZERS_TABLE=Organizers",
		});

		new cdk.CfnOutput(this, "DynamoDbBillingRecordsEnvVar", {
			value: "DYNAMODB_BILLING_RECORDS_TABLE=BillingRecords",
		});
	}
}
