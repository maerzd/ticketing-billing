import { z } from "zod";

const envSchema = z
	.object({
		// Public (safe to expose to browser)
		NEXT_PUBLIC_QONTO_CLIENT_ID: z.string().min(1),
		NEXT_PUBLIC_QONTO_REDIRECT_URI: z.url(),
		QONTO_SANDBOX: z
			.string()
			.default("true")
			.transform((val) => val !== "false"),

		// Server-side only (never expose to client)
		QONTO_CLIENT_SECRET: z.string().min(1),
		QONTO_STAGING_TOKEN: z.string().optional(),
		QONTO_VOP_PROOF_TOKEN: z.string().optional(),
		QONTO_BANK_ACCOUNT_ID: z.string().optional(),
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
	NEXT_PUBLIC_QONTO_CLIENT_ID: process.env.NEXT_PUBLIC_QONTO_CLIENT_ID,
	NEXT_PUBLIC_QONTO_REDIRECT_URI: process.env.NEXT_PUBLIC_QONTO_REDIRECT_URI,
	QONTO_CLIENT_SECRET: process.env.QONTO_CLIENT_SECRET,
	QONTO_STAGING_TOKEN: process.env.QONTO_STAGING_TOKEN,
	QONTO_VOP_PROOF_TOKEN: process.env.QONTO_VOP_PROOF_TOKEN,
	QONTO_BANK_ACCOUNT_ID: process.env.QONTO_BANK_ACCOUNT_ID,
	QONTO_SANDBOX: process.env.QONTO_SANDBOX,
});

export default env;
