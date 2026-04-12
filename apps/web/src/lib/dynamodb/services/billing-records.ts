import {
	ConditionalCheckFailedException,
	InternalServerError,
} from "@aws-sdk/client-dynamodb";
import {
	BatchGetCommand,
	GetCommand,
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
	type BillingRecord,
	BillingRecordSchema,
	type BillingStatus,
	type CreateBillingRecordInput,
	CreateBillingRecordInputSchema,
	deriveBillingStatus,
	type UpdateBillingRecordInput,
	UpdateBillingRecordInputSchema,
} from "@ticketing-billing/types/ddb";
import env from "@/env";
import { getDynamoDBDocumentClient } from "@/lib/dynamodb/client";
import { AppError } from "@/lib/errors";

export class BillingRecordsService {
	private readonly tableName = env.DYNAMODB_BILLING_RECORDS_TABLE;

	private readonly client = getDynamoDBDocumentClient();

	async getBillingRecord(
		organizerId: string,
		eventId: string,
	): Promise<BillingRecord | null> {
		const response = await this.client.send(
			new GetCommand({
				TableName: this.tableName,
				Key: { organizerId, eventId },
			}),
		);

		if (!response.Item) {
			return null;
		}

		return BillingRecordSchema.parse(response.Item);
	}

	async createBillingRecord(
		input: CreateBillingRecordInput,
	): Promise<BillingRecord> {
		const parsed = CreateBillingRecordInputSchema.parse(input);
		const now = new Date().toISOString();

		const item: BillingRecord = {
			...parsed,
			billingStatus: deriveBillingStatus(
				parsed.invoiceStatus,
				parsed.payoutStatus,
			),
			createdAt: now,
			updatedAt: now,
		};

		try {
			await this.client.send(
				new PutCommand({
					TableName: this.tableName,
					Item: item,
					ConditionExpression:
						"attribute_not_exists(organizerId) AND attribute_not_exists(eventId)",
				}),
			);
		} catch (error) {
			if (error instanceof ConditionalCheckFailedException) {
				throw new AppError(
					"A billing record for this event already exists",
					409,
				);
			}

			if (error instanceof InternalServerError) {
				throw new AppError("DynamoDB internal server error", 500);
			}

			throw error;
		}

		return item;
	}

	async updateBillingRecord(
		input: UpdateBillingRecordInput,
	): Promise<BillingRecord> {
		const parsed = UpdateBillingRecordInputSchema.parse(input);
		const { organizerId, eventId, ...patch } = parsed;
		const now = new Date().toISOString();

		const expressionNames: Record<string, string> = {
			"#updatedAt": "updatedAt",
			"#billingStatus": "billingStatus",
		};
		const expressionValues: Record<string, unknown> = {
			":updatedAt": now,
		};
		const updates: string[] = [
			"#updatedAt = :updatedAt",
			"#billingStatus = :billingStatus",
		];

		for (const [key, value] of Object.entries(patch)) {
			if (value === undefined) {
				continue;
			}

			expressionNames[`#${key}`] = key;
			expressionValues[`:${key}`] = value;
			updates.push(`#${key} = :${key}`);
		}

		// We need current invoiceStatus and payoutStatus to derive billingStatus.
		// They may be in the patch or we must fetch them.
		const current = await this.getBillingRecord(organizerId, eventId);
		if (!current) {
			throw new AppError("Billing record not found", 404);
		}

		const newInvoiceStatus = (patch.invoiceStatus ??
			current.invoiceStatus) as BillingRecord["invoiceStatus"];
		const newPayoutStatus = (patch.payoutStatus ??
			current.payoutStatus) as BillingRecord["payoutStatus"];
		expressionValues[":billingStatus"] = deriveBillingStatus(
			newInvoiceStatus,
			newPayoutStatus,
		);

		try {
			const response = await this.client.send(
				new UpdateCommand({
					TableName: this.tableName,
					Key: { organizerId, eventId },
					UpdateExpression: `SET ${updates.join(", ")}`,
					ExpressionAttributeNames: expressionNames,
					ExpressionAttributeValues: expressionValues,
					ConditionExpression:
						"attribute_exists(organizerId) AND attribute_exists(eventId)",
					ReturnValues: "ALL_NEW",
				}),
			);

			return BillingRecordSchema.parse(response.Attributes);
		} catch (error) {
			if (error instanceof ConditionalCheckFailedException) {
				throw new AppError("Billing record not found", 404);
			}

			throw error;
		}
	}

	async getBillingRecordByEventId(
		eventId: string,
	): Promise<BillingRecord | null> {
		const response = await this.client.send(
			new QueryCommand({
				TableName: this.tableName,
				IndexName: "EventIndex",
				KeyConditionExpression: "#eventId = :eventId",
				ExpressionAttributeNames: { "#eventId": "eventId" },
				ExpressionAttributeValues: { ":eventId": eventId },
				Limit: 1,
			}),
		);

		const item = response.Items?.[0];
		if (!item) {
			return null;
		}

		return BillingRecordSchema.parse(item);
	}

	async getBillingRecordsByStatus(
		billingStatus: BillingStatus,
	): Promise<BillingRecord[]> {
		const results: BillingRecord[] = [];
		let lastEvaluatedKey: Record<string, unknown> | undefined;

		do {
			const response = await this.client.send(
				new QueryCommand({
					TableName: this.tableName,
					IndexName: "StatusIndex",
					KeyConditionExpression: "#billingStatus = :billingStatus",
					ExpressionAttributeNames: { "#billingStatus": "billingStatus" },
					ExpressionAttributeValues: { ":billingStatus": billingStatus },
					ExclusiveStartKey: lastEvaluatedKey,
				}),
			);

			for (const item of response.Items ?? []) {
				results.push(BillingRecordSchema.parse(item));
			}

			lastEvaluatedKey = response.LastEvaluatedKey;
		} while (lastEvaluatedKey);

		return results;
	}

	async batchGetBillingRecords(
		keys: Array<{ organizerId: string; eventId: string }>,
	): Promise<BillingRecord[]> {
		if (keys.length === 0) {
			return [];
		}

		const results: BillingRecord[] = [];

		// DynamoDB BatchGet supports max 100 items per request
		for (let i = 0; i < keys.length; i += 100) {
			const chunk = keys.slice(i, i + 100);
			const response = await this.client.send(
				new BatchGetCommand({
					RequestItems: {
						[this.tableName]: {
							Keys: chunk,
						},
					},
				}),
			);

			for (const item of response.Responses?.[this.tableName] ?? []) {
				results.push(BillingRecordSchema.parse(item));
			}
		}

		return results;
	}

	async listBillingRecordsForOrganizer(
		organizerId: string,
	): Promise<BillingRecord[]> {
		const results: BillingRecord[] = [];
		let lastEvaluatedKey: Record<string, unknown> | undefined;

		do {
			const response = await this.client.send(
				new QueryCommand({
					TableName: this.tableName,
					KeyConditionExpression: "#organizerId = :organizerId",
					ExpressionAttributeNames: { "#organizerId": "organizerId" },
					ExpressionAttributeValues: { ":organizerId": organizerId },
					ExclusiveStartKey: lastEvaluatedKey,
				}),
			);

			for (const item of response.Items ?? []) {
				results.push(BillingRecordSchema.parse(item));
			}

			lastEvaluatedKey = response.LastEvaluatedKey;
		} while (lastEvaluatedKey);

		return results;
	}
}
