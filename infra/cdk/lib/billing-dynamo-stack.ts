import * as cdk from "aws-cdk-lib";
import {
	AttributeType,
	BillingMode,
	Table,
	TableEncryption,
} from "aws-cdk-lib/aws-dynamodb";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export const SSM_ORGANIZERS_TABLE =
	"/ticketing-billing/dynamodb/organizers-table-name";
export const SSM_BILLING_RECORDS_TABLE =
	"/ticketing-billing/dynamodb/billing-records-table-name";

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

		new ssm.StringParameter(this, "OrganizersTableNameParam", {
			parameterName: SSM_ORGANIZERS_TABLE,
			stringValue: this.organizersTable.tableName,
			description: "DynamoDB Organizers table name",
		});

		new ssm.StringParameter(this, "BillingRecordsTableNameParam", {
			parameterName: SSM_BILLING_RECORDS_TABLE,
			stringValue: this.billingRecordsTable.tableName,
			description: "DynamoDB BillingRecords table name",
		});
	}
}
