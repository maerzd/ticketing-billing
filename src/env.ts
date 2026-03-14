import { z } from "zod";

const envSchema = z
	.object({
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
	QONTO_CLIENT_ID: process.env.QONTO_CLIENT_ID,
	QONTO_CLIENT_SECRET: process.env.QONTO_CLIENT_SECRET,
	QONTO_ORGANIZATION_ID: process.env.QONTO_ORGANIZATION_ID,
	QONTO_REGISTRATION_ID: process.env.QONTO_REGISTRATION_ID,
	QONTO_STAGING_TOKEN: process.env.QONTO_STAGING_TOKEN,
	QONTO_SANDBOX: process.env.QONTO_SANDBOX,
});

export default env;
