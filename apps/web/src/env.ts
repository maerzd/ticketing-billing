import { z } from "zod";

const envSchema = z
	.object({
		AWS_REGION: z.string().min(1),
		AWS_ACCESS_KEY_ID: z.string().optional(),
		AWS_SECRET_ACCESS_KEY: z.string().optional(),
		AWS_SESSION_TOKEN: z.string().optional(),
		DYNAMODB_ORGANIZERS_TABLE: z.string().min(1),
		DYNAMODB_BILLING_RECORDS_TABLE: z.string().min(1),

		// Public (safe to expose to browser)
		QONTO_CLIENT_ID: z.string().min(1),
		QONTO_ORGANIZATION_ID: z.string().uuid().optional(),
		QONTO_REGISTRATION_ID: z.string().uuid().optional(),
		QONTO_SANDBOX: z
			.string()
			.default("false")
			.transform((val) => val !== "false"),

		// Server-side only (never expose to client)
		QONTO_CLIENT_SECRET: z.string().min(1),
		QONTO_STAGING_TOKEN: z.string().optional(),
	})
	.superRefine((value, context) => {
		if (value.QONTO_SANDBOX && !value.QONTO_STAGING_TOKEN) {
			context.addIssue({
				code: "custom",
				path: ["QONTO_STAGING_TOKEN"],
				message: "QONTO_STAGING_TOKEN is required when QONTO_SANDBOX=true",
			});
		}
	});

// Parse and validate environment variables
const env = envSchema.parse({
	AWS_REGION: process.env.AWS_REGION,
	AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
	AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
	DYNAMODB_ORGANIZERS_TABLE: process.env.DYNAMODB_ORGANIZERS_TABLE,
	DYNAMODB_BILLING_RECORDS_TABLE: process.env.DYNAMODB_BILLING_RECORDS_TABLE,

	QONTO_CLIENT_ID: process.env.QONTO_CLIENT_ID,
	QONTO_CLIENT_SECRET: process.env.QONTO_CLIENT_SECRET,
	QONTO_ORGANIZATION_ID: process.env.QONTO_ORGANIZATION_ID,
	QONTO_REGISTRATION_ID: process.env.QONTO_REGISTRATION_ID,
	QONTO_STAGING_TOKEN: process.env.QONTO_STAGING_TOKEN,
	QONTO_SANDBOX: process.env.QONTO_SANDBOX,
});

export default env;
