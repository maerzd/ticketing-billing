import * as cdk from "aws-cdk-lib";
import {
	AttributeType,
	BillingMode,
	Table,
	TableEncryption,
} from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export class BillingDynamoStack extends cdk.Stack {
	public readonly organizersTable: Table;
	public readonly billingRecordsTable: Table;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		this.organizersTable = new Table(this, "OrganizersTable", {
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

		this.billingRecordsTable = new Table(this, "BillingRecordsTable", {
			partitionKey: {
				name: "organizerId",
				type: AttributeType.STRING,
			},
			sortKey: {
				name: "eventId",
				type: AttributeType.STRING,
			},
			billingMode: BillingMode.PAY_PER_REQUEST,
			pointInTimeRecoverySpecification: {
				pointInTimeRecoveryEnabled: true,
			},
			encryption: TableEncryption.AWS_MANAGED,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		this.billingRecordsTable.addGlobalSecondaryIndex({
			indexName: "StatusIndex",
			partitionKey: {
				name: "billingStatus",
				type: AttributeType.STRING,
			},
			sortKey: {
				name: "updatedAt",
				type: AttributeType.STRING,
			},
			projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
		});

		this.billingRecordsTable.addGlobalSecondaryIndex({
			indexName: "EventIndex",
			partitionKey: {
				name: "eventId",
				type: AttributeType.STRING,
			},
			projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
		});

		new cdk.CfnOutput(this, "OrganizersTableName", {
			value: this.organizersTable.tableName,
			exportName: "OrganizersTableName",
		});

		new cdk.CfnOutput(this, "BillingRecordsTableName", {
			value: this.billingRecordsTable.tableName,
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
