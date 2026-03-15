import { z } from "zod";

export const QontoTransferStatusSchema = z.enum([
	"pending",
	"processing",
	"canceled",
	"declined",
	"settled",
]);

export type QontoTransferStatus = z.infer<typeof QontoTransferStatusSchema>;
const transferSchema = z.object({
	id: z.uuid(),
	initiator_id: z.uuid(),
	bank_account_id: z.uuid(),
	amount: z.number(),
	amount_cents: z.number().int(),
	amount_currency: z.string(),
	status: QontoTransferStatusSchema,
	beneficiary_id: z.uuid(),
	reference: z.string(),
	note: z.string().nullable(),
	declined_reason: z.string().nullable(),
	scheduled_date: z.iso.date().nullable(),
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
	processed_at: z.iso.datetime().nullable(),
	completed_at: z.iso.datetime().nullable(),
	transaction_id: z.uuid().nullable(),
	recurring_transfer_id: z.uuid().nullable(),
});

const metaSchema = z.object({
	current_page: z.number().int(),
	next_page: z.number().int().nullable(),
	prev_page: z.number().int().nullable(),
	total_pages: z.number().int(),
	total_count: z.number().int(),
	per_page: z.number().int(),
});

export const QontoListSepaTransfersSchema = z.object({
	transfers: z.array(transferSchema),
	meta: metaSchema,
});

export type QontoListSepaTransfers = z.infer<
	typeof QontoListSepaTransfersSchema
>;
