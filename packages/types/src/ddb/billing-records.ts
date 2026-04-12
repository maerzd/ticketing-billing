import { z } from "zod";

export const InvoiceStatusSchema = z.enum([
	"DRAFT",
	"OPEN",
	"SENT",
	"PAID",
	"VOID",
]);

export const PayoutStatusSchema = z.enum([
	"PENDING",
	"INITIATED",
	"COMPLETED",
	"FAILED",
]);

export const BillingStatusSchema = z.enum([
	"PENDING",
	"IN_PROGRESS",
	"COMPLETED",
	"ATTENTION_NEEDED",
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>;
export type BillingStatus = z.infer<typeof BillingStatusSchema>;

/**
 * Derives a composite billing status from the individual invoice and payout statuses.
 * Used before every DynamoDB write to keep the denormalized GSI attribute up-to-date.
 */
export function deriveBillingStatus(
	invoiceStatus: InvoiceStatus,
	payoutStatus: PayoutStatus,
): BillingStatus {
	// Terminal error states
	if (invoiceStatus === "VOID" || payoutStatus === "FAILED") {
		return "ATTENTION_NEEDED";
	}

	// Fully done
	if (payoutStatus === "COMPLETED") {
		return "COMPLETED";
	}

	// Nothing started yet
	if (invoiceStatus === "DRAFT" && payoutStatus === "PENDING") {
		return "PENDING";
	}

	// Anything in between
	return "IN_PROGRESS";
}

export const BillingRecordSchema = z.object({
	// Keys
	organizerId: z.string().min(1),
	eventId: z.string().min(1),

	// Identity
	eventName: z.string().min(1),
	organizerName: z.string().min(1),

	// Status fields
	invoiceStatus: InvoiceStatusSchema,
	payoutStatus: PayoutStatusSchema,
	/** Derived composite status — used by StatusIndex GSI for dashboard queries. */
	billingStatus: BillingStatusSchema,

	// External service references
	sevdeskInvoiceId: z.string().optional(),
	sevdeskInvoiceNumber: z.string().optional(),
	qontoTransferId: z.string().optional(),

	// Settings snapshot (captured at creation, immutable after)
	eventTaxRate: z.number().min(0).max(1),
	/** Setup fee in cents */
	setupFee: z.number().int().min(0),
	ticketCommissionRate: z.number().min(0).max(1),
	/** POS IDs that belong to the organizer (not zünftick) */
	officialPos: z.array(z.string()).default([]),

	// Financials — all values in cents
	totalRevenueCents: z.number().int().min(0),
	invoiceAmountCents: z.number().int().min(0),
	invoiceNetCents: z.number().int().min(0),
	payoutAmountCents: z.number().int().min(0),
	ticketsCount: z.number().int().min(0),
	revenueOrganizerCents: z.number().int().min(0),

	// Timestamps
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	invoiceFinalizedAt: z.iso.datetime().optional(),
	emailSentAt: z.iso.datetime().optional(),
	payoutInitiatedAt: z.iso.datetime().optional(),
	payoutCompletedAt: z.iso.datetime().optional(),
});

export type BillingRecord = z.infer<typeof BillingRecordSchema>;

export const CreateBillingRecordInputSchema = BillingRecordSchema.omit({
	createdAt: true,
	updatedAt: true,
	billingStatus: true,
});

export const UpdateBillingRecordInputSchema = BillingRecordSchema.partial()
	.extend({
		organizerId: z.string().min(1),
		eventId: z.string().min(1),
	})
	.omit({ billingStatus: true })
	.refine((value) => Object.keys(value).length > 2, {
		message: "At least one field besides the keys must be updated",
	});

export type CreateBillingRecordInput = z.infer<
	typeof CreateBillingRecordInputSchema
>;
export type UpdateBillingRecordInput = z.infer<
	typeof UpdateBillingRecordInputSchema
>;
