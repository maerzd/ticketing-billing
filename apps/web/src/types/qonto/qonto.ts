import { z } from "zod";

// OAuth Token Types
export const QontoTokenResponseSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	expires_in: z.number(),
	token_type: z.string().default("Bearer"),
	scope: z.string(),
});

export type QontoTokenResponse = z.infer<typeof QontoTokenResponseSchema>;

export const QontoOAuthErrorSchema = z.object({
	error: z.string(),
	error_description: z.string().optional(),
});

export type QontoOAuthError = z.infer<typeof QontoOAuthErrorSchema>;

const QontoPaginationSchema = z.object({
	total: z.coerce.number().default(0),
	per_page: z.coerce.number().default(25),
	current_page: z.coerce.number().default(1),
	total_pages: z.coerce.number().default(1),
});

// Verification of Payee (VOP) Types

// Verification of Payee (VOP) Types
export const QontoVerifyPayeeSchema = z.object({
	iban: z.string(),
	beneficiary_name: z.string(),
});

export type QontoVerifyPayee = z.infer<typeof QontoVerifyPayeeSchema>;

export const QontoVerifyPayeeResponseSchema = z.object({
	match_result: z.enum([
		"MATCH_RESULT_MATCH",
		"MATCH_RESULT_CLOSE_MATCH",
		"MATCH_RESULT_NO_MATCH",
		"MATCH_RESULT_NOT_POSSIBLE",
		"MATCH_RESULT_UNSPECIFIED",
	]),
	matched_name: z.string().nullable().optional(),
	proof_token: z.object({
		token: z.string(),
	}),
});

export type QontoVerifyPayeeResponse = z.infer<
	typeof QontoVerifyPayeeResponseSchema
>;

export const QontoExternalTransferSchema = z.object({
	id: z.string(),
	organization_id: z.string().optional().default(""),
	beneficiary_id: z.string().optional().default(""),
	amount_in_cents: z.unknown().optional(),
	amount_cents: z.unknown().optional(),
	amount: z.unknown().optional(),
	amount_currency: z.string().optional(),
	currency: z.string().optional(),
	label: z.string().optional(),
	note: z.string().optional(),
	reference: z.string().optional(),
	status: z.unknown().optional(),
	executed_date: z.string().nullable().optional(),
	processed_at: z.string().optional(),
	completed_at: z.string().optional(),
	scheduled_date: z.string().optional(),
	created_at: z.string().optional().default(""),
});

export type QontoExternalTransfer = z.infer<typeof QontoExternalTransferSchema>;

export const QontoExternalTransferListSchema = z
	.union([
		z.object({
			data: z.array(QontoExternalTransferSchema),
			pagination: QontoPaginationSchema,
		}),
		z.object({
			transfers: z.array(QontoExternalTransferSchema),
			meta: z
				.object({
					total: z.coerce.number().optional(),
					total_count: z.coerce.number().optional(),
					per_page: z.coerce.number().optional(),
					current_page: z.coerce.number().optional(),
					total_pages: z.coerce.number().optional(),
				})
				.optional(),
		}),
		z.array(QontoExternalTransferSchema),
	])
	.transform((input) => {
		if (Array.isArray(input)) {
			return {
				data: input,
				pagination: {
					total: input.length,
					per_page: input.length,
					current_page: 1,
					total_pages: 1,
				},
			};
		}

		if ("data" in input) {
			return input;
		}

		const list = input.transfers;
		const meta = input.meta;

		return {
			data: list,
			pagination: {
				total: meta?.total ?? meta?.total_count ?? list.length,
				per_page: meta?.per_page ?? list.length,
				current_page: meta?.current_page ?? 1,
				total_pages: meta?.total_pages ?? 1,
			},
		};
	});

export type QontoExternalTransferList = z.infer<
	typeof QontoExternalTransferListSchema
>;

// API Request/Response Wrappers
export const QontoAPIErrorSchema = z.object({
	errors: z.array(
		z.object({
			status: z.number(),
			code: z.string(),
			detail: z.string(),
			source: z
				.object({
					pointer: z.string().optional(),
					parameter: z.string().optional(),
				})
				.optional(),
		}),
	),
});

export type QontoAPIError = z.infer<typeof QontoAPIErrorSchema>;
