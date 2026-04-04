import {
	ConditionalCheckFailedException,
	InternalServerError,
} from "@aws-sdk/client-dynamodb";
import {
	GetCommand,
	PutCommand,
	ScanCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
	type CreateOrganizerInput,
	CreateOrganizerInputSchema,
	type OrganizerRecord,
	OrganizerRecordSchema,
	type UpdateOrganizerInput,
	UpdateOrganizerInputSchema,
} from "@ticketing-billing/types/ddb";
import env from "@/env";
import { getDynamoDBDocumentClient } from "@/lib/dynamodb/client";
import { AppError } from "@/lib/errors";

export class OrganizersService {
	private readonly tableName = env.DYNAMODB_ORGANIZERS_TABLE;

	private readonly client = getDynamoDBDocumentClient();

	async listOrganizers() {
		const results: OrganizerRecord[] = [];
		let lastEvaluatedKey: Record<string, unknown> | undefined;

		do {
			const response = await this.client.send(
				new ScanCommand({
					TableName: this.tableName,
					ExclusiveStartKey: lastEvaluatedKey,
				}),
			);

			for (const item of response.Items ?? []) {
				results.push(OrganizerRecordSchema.parse(item));
			}

			lastEvaluatedKey = response.LastEvaluatedKey;
		} while (lastEvaluatedKey);

		results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		return results;
	}

	async getOrganizer(organizerId: string) {
		const response = await this.client.send(
			new GetCommand({
				TableName: this.tableName,
				Key: { organizerId },
			}),
		);

		if (!response.Item) {
			return null;
		}

		return OrganizerRecordSchema.parse(response.Item);
	}

	async createOrganizer(input: CreateOrganizerInput) {
		const parsed = CreateOrganizerInputSchema.parse(input);
		const now = new Date().toISOString();

		const item: OrganizerRecord = {
			...parsed,
			createdAt: now,
			updatedAt: now,
		};

		try {
			await this.client.send(
				new PutCommand({
					TableName: this.tableName,
					Item: item,
					ConditionExpression: "attribute_not_exists(organizerId)",
				}),
			);
		} catch (error) {
			if (error instanceof ConditionalCheckFailedException) {
				throw new AppError(
					"An organizer with this organizer ID already exists",
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

	async updateOrganizer(input: UpdateOrganizerInput) {
		const parsed = UpdateOrganizerInputSchema.parse(input);
		const { organizerId, ...patch } = parsed;
		const now = new Date().toISOString();

		const expressionNames: Record<string, string> = {
			"#updatedAt": "updatedAt",
		};
		const expressionValues: Record<string, unknown> = {
			":updatedAt": now,
		};
		const updates: string[] = ["#updatedAt = :updatedAt"];

		for (const [key, value] of Object.entries(patch)) {
			if (value === undefined) {
				continue;
			}

			expressionNames[`#${key}`] = key;
			expressionValues[`:${key}`] = value;
			updates.push(`#${key} = :${key}`);
		}

		try {
			const response = await this.client.send(
				new UpdateCommand({
					TableName: this.tableName,
					Key: { organizerId },
					UpdateExpression: `SET ${updates.join(", ")}`,
					ExpressionAttributeNames: expressionNames,
					ExpressionAttributeValues: expressionValues,
					ConditionExpression: "attribute_exists(organizerId)",
					ReturnValues: "ALL_NEW",
				}),
			);

			if (!response.Attributes) {
				throw new AppError("Veranstalter not found", 404);
			}

			return OrganizerRecordSchema.parse(response.Attributes);
		} catch (error) {
			if (error instanceof ConditionalCheckFailedException) {
				throw new AppError("Veranstalter not found", 404);
			}

			throw error;
		}
	}
}
