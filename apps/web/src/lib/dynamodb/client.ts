import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import env from "@/env";

let documentClient: DynamoDBDocumentClient | null = null;

const getCredentials = () => {
	if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		return undefined;
	}

	return {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		sessionToken: env.AWS_SESSION_TOKEN,
	};
};

export const getDynamoDBDocumentClient = () => {
	if (documentClient) {
		return documentClient;
	}

	const client = new DynamoDBClient({
		region: env.AWS_REGION,
		credentials: getCredentials(),
	});

	documentClient = DynamoDBDocumentClient.from(client, {
		marshallOptions: {
			removeUndefinedValues: true,
		},
	});

	return documentClient;
};
