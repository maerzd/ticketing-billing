import { z } from "zod";

const envSchema = z
	.object({
		AWS_REGION: z.string().min(1),
		AWS_ROLE_ARN: z.string().optional(),
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

		SEVDESK_API_URL: z.string().url().default("https://my.sevdesk.de/api/v1"),
		SEVDESK_API_TOKEN: z.string().min(1),
		SEVDESK_CONTACT_CATEGORY_ID: z.coerce.string().default("3"),
		SEVDESK_CONTACT_ADDRESS_CATEGORY_ID: z.coerce.string().default("43"),
		SEVDESK_COUNTRY_ID: z.coerce.string().default("1"),
		SEVDESK_TAX_RULE_ID: z.coerce.string().default("1"),
		SEVDESK_CONTACT_PERSON_ID: z.coerce.string().default("1469956"),
		SEVDESK_INVOICE_UNIT_ID: z.coerce.string().default("1"),

		RESEND_API_KEY: z.string().min(1),
		RESEND_FROM_EMAIL: z.string().email().default("noreply@zuenftick.de"),
		WORKOS_API_KEY: z.string().min(1),
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
	AWS_ROLE_ARN: process.env.AWS_ROLE_ARN,
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

	SEVDESK_API_URL: process.env.SEVDESK_API_URL,
	SEVDESK_API_TOKEN: process.env.SEVDESK_API_TOKEN,
	SEVDESK_CONTACT_CATEGORY_ID: process.env.SEVDESK_CONTACT_CATEGORY_ID,
	SEVDESK_CONTACT_ADDRESS_CATEGORY_ID:
		process.env.SEVDESK_CONTACT_ADDRESS_CATEGORY_ID,
	SEVDESK_COUNTRY_ID: process.env.SEVDESK_COUNTRY_ID,
	SEVDESK_TAX_RULE_ID: process.env.SEVDESK_TAX_RULE_ID,
	SEVDESK_CONTACT_PERSON_ID: process.env.SEVDESK_CONTACT_PERSON_ID,
	SEVDESK_INVOICE_UNIT_ID: process.env.SEVDESK_INVOICE_UNIT_ID,

	RESEND_API_KEY: process.env.RESEND_API_KEY,
	RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,

	WORKOS_API_KEY: process.env.WORKOS_API_KEY,
});

export default env;
