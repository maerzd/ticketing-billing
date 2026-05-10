"use server";

import { sepaTransfers } from "@qonto/embed-sdk/server/sepa-transfers";
import type { BillingRecord } from "@ticketing-billing/types/ddb";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth";
import {
	type BillingAmounts,
	calculateBillingAmounts,
} from "@/lib/billing-calculator";
import {
	BILLING_SETUP_FEE_LABEL,
	BILLING_SYSTEM_FEE_LABEL,
	BILLING_VARIABLE_FEE_LABEL,
	SALES_TAX_RATE,
} from "@/lib/constants";
import { BillingRecordsService } from "@/lib/dynamodb/services/billing-records";
import { AppError } from "@/lib/errors";
import { ResendEmailService } from "@/lib/resend/services/email";
import { SevdeskClient } from "@/lib/sevdesk/client";
import type { CreateInvoiceDraftInput } from "@/lib/sevdesk/services/invoices";
import { SevdeskInvoicesService } from "@/lib/sevdesk/services/invoices";

const billingRecordsService = new BillingRecordsService();
const sevdeskClient = new SevdeskClient();
const sevdeskInvoicesService = new SevdeskInvoicesService(sevdeskClient);
const emailService = new ResendEmailService();

const BILLING_INVOICE_TIME_TO_PAY = 14;
const BILLING_INVOICE_HEADER = "Rechnung";
const BILLING_INVOICE_HEAD_TEXT =
	"<p>\n    Sehr geehrte Damen und Herren,\n</p>\n<p>\n    wir erlauben uns, von den Einnahmen Ihrer Veranstaltung unsere Gebühren abzuziehen und zahlen den Restbetrag an Sie aus. Im Folgenden finden Sie eine detaillierte Ausführung der einzelnen Positionen.\n</p>";

function toCents(euros: number): number {
	return Math.round(euros * 100);
}

function actionError(error: unknown, fallback: string) {
	const message =
		error instanceof AppError || error instanceof Error
			? error.message
			: fallback;
	console.error(fallback, message);
	return { success: false as const, error: message };
}

// ---------------------------------------------------------------------------
// Shared draft input (create + update share a common base)
// ---------------------------------------------------------------------------

export interface BillingDraftInput {
	organizerId: string;
	eventId: string;
	organizerContactId: string;
	organizerAddressName?: string;
	organizerAddressStreet?: string;
	organizerAddressZip?: string;
	organizerAddressCity?: string;
	organizerAddressCountry?: string;
	totalRevenue: number;
	ticketsCount: number;
	revenuePerPos: Record<string, number>;
	officialPos: string[];
	eventTaxRate: number;
	/** Setup fee in euros */
	setupFee: number;
	ticketCommissionRate: number;
	invoiceDate: string;
	invoiceFootHtml: string;
}

/** Additional fields required only when creating a record for the first time */
export interface CreateBillingDraftInput extends BillingDraftInput {
	eventName: string;
	organizerName: string;
	organizerEmail: string;
}

export type UpdateBillingDraftInput = BillingDraftInput;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function buildSevdeskDraftInput(
	amounts: BillingAmounts,
	input: BillingDraftInput,
): CreateInvoiceDraftInput {
	return {
		organizerContactId: input.organizerContactId,
		invoiceDate: input.invoiceDate,
		timeToPay: BILLING_INVOICE_TIME_TO_PAY,
		header: BILLING_INVOICE_HEADER,
		headText: BILLING_INVOICE_HEAD_TEXT,
		footText: input.invoiceFootHtml,
		items: [
			{
				name: BILLING_SYSTEM_FEE_LABEL,
				quantity: 1,
				price: amounts.systemFeeNet,
				taxRate: SALES_TAX_RATE,
			},
			{
				name: BILLING_VARIABLE_FEE_LABEL,
				quantity: 1,
				price: amounts.variableFeeNet,
				taxRate: input.eventTaxRate,
			},
			{
				name: BILLING_SETUP_FEE_LABEL,
				quantity: 1,
				price: amounts.setupFeeNet,
				taxRate: SALES_TAX_RATE,
			},
		],
		addressName: input.organizerAddressName,
		addressStreet: input.organizerAddressStreet,
		addressZip: input.organizerAddressZip,
		addressCity: input.organizerAddressCity,
		addressCountry: input.organizerAddressCountry,
		address: input.organizerAddressName
			? `${input.organizerAddressName}\n${input.organizerAddressStreet ?? ""}\n${input.organizerAddressZip ?? ""} ${input.organizerAddressCity ?? ""}`
			: undefined,
	};
}

function buildBillingRecordAmounts(
	amounts: BillingAmounts,
	input: BillingDraftInput,
) {
	return {
		eventTaxRate: input.eventTaxRate,
		setupFee: toCents(amounts.setupFeeNet),
		ticketCommissionRate: input.ticketCommissionRate,
		officialPos: input.officialPos,
		totalRevenueCents: toCents(input.totalRevenue),
		invoiceAmountCents: toCents(amounts.invoiceAmount),
		invoiceNetCents: toCents(amounts.netInvoiceAmount),
		payoutAmountCents: toCents(amounts.payoutAmount),
		ticketsCount: input.ticketsCount,
		revenueOrganizerCents: toCents(amounts.revenueOrganizer),
	};
}

// ---------------------------------------------------------------------------
// createBillingDraft
// ---------------------------------------------------------------------------

export async function createBillingDraft(input: CreateBillingDraftInput) {
	try {
		const existing = await billingRecordsService.getBillingRecord(
			input.organizerId,
			input.eventId,
		);

		if (existing) {
			throw new AppError("A billing record for this event already exists", 409);
		}

		const amounts = calculateBillingAmounts({
			totalRevenue: input.totalRevenue,
			ticketsCount: input.ticketsCount,
			revenuePerPos: input.revenuePerPos,
			officialPos: new Set(input.officialPos),
			eventTaxRate: input.eventTaxRate,
			setupFee: input.setupFee,
			ticketCommissionRate: input.ticketCommissionRate,
		});

		const invoice = await sevdeskInvoicesService.createInvoiceDraft(
			buildSevdeskDraftInput(amounts, input),
		);

		const record = await billingRecordsService.createBillingRecord({
			organizerId: input.organizerId,
			eventId: input.eventId,
			eventName: input.eventName,
			organizerName: input.organizerName,
			invoiceStatus: "DRAFT",
			payoutStatus: "PENDING",
			sevdeskInvoiceId: invoice.id,
			sevdeskInvoiceNumber: invoice.invoiceNumber ?? undefined,
			...buildBillingRecordAmounts(amounts, input),
		});

		revalidatePath(`/events/${input.eventId}`);
		revalidatePath("/events");

		return { success: true as const, data: record };
	} catch (error) {
		return actionError(error, "Failed to create billing draft");
	}
}

// ---------------------------------------------------------------------------
// updateBillingDraft
// ---------------------------------------------------------------------------

export async function updateBillingDraft(input: UpdateBillingDraftInput) {
	try {
		const record = await billingRecordsService.getBillingRecord(
			input.organizerId,
			input.eventId,
		);

		if (!record) {
			throw new AppError("Billing record not found", 404);
		}

		if (record.invoiceStatus !== "DRAFT") {
			throw new AppError(
				"Invoice can only be updated while in DRAFT status",
				409,
			);
		}

		if (!record.sevdeskInvoiceId) {
			throw new AppError("No SevDesk invoice ID on record", 500);
		}

		const amounts = calculateBillingAmounts({
			totalRevenue: input.totalRevenue,
			ticketsCount: input.ticketsCount,
			revenuePerPos: input.revenuePerPos,
			officialPos: new Set(input.officialPos),
			eventTaxRate: input.eventTaxRate,
			setupFee: input.setupFee,
			ticketCommissionRate: input.ticketCommissionRate,
		});

		await sevdeskInvoicesService.updateInvoiceDraft(
			record.sevdeskInvoiceId,
			buildSevdeskDraftInput(amounts, input),
		);

		const updated = await billingRecordsService.updateBillingRecord({
			organizerId: input.organizerId,
			eventId: input.eventId,
			...buildBillingRecordAmounts(amounts, input),
		});

		revalidatePath(`/events/${input.eventId}`);

		return { success: true as const, data: updated };
	} catch (error) {
		return actionError(error, "Failed to update billing draft");
	}
}

// ---------------------------------------------------------------------------
// finalizeBillingInvoice
// ---------------------------------------------------------------------------

export async function finalizeBillingInvoice(
	organizerId: string,
	eventId: string,
) {
	try {
		const record = await billingRecordsService.getBillingRecord(
			organizerId,
			eventId,
		);

		if (!record) {
			throw new AppError("Billing record not found", 404);
		}

		if (record.invoiceStatus !== "DRAFT") {
			throw new AppError("Invoice is not in DRAFT status", 409);
		}

		if (!record.sevdeskInvoiceId) {
			throw new AppError("No SevDesk invoice ID on record", 500);
		}

		await sevdeskInvoicesService.finalizeInvoice(
			record.sevdeskInvoiceId,
			false,
		);

		const updated = await billingRecordsService.updateBillingRecord({
			organizerId,
			eventId,
			invoiceStatus: "OPEN",
			invoiceFinalizedAt: new Date().toISOString(),
		});

		revalidatePath(`/events/${eventId}`);
		revalidatePath("/events");

		return { success: true as const, data: updated };
	} catch (error) {
		return actionError(error, "Failed to finalize invoice");
	}
}

// ---------------------------------------------------------------------------
// sendBillingEmail
// ---------------------------------------------------------------------------

export async function sendBillingEmail(
	organizerId: string,
	eventId: string,
	recipientEmail: string,
) {
	try {
		const record = await billingRecordsService.getBillingRecord(
			organizerId,
			eventId,
		);

		if (!record) {
			throw new AppError("Billing record not found", 404);
		}

		const openStatuses: BillingRecord["invoiceStatus"][] = [
			"OPEN",
			"SENT",
			"PAID",
		];

		if (!openStatuses.includes(record.invoiceStatus)) {
			throw new AppError("Invoice must be finalized before sending email", 409);
		}

		if (!record.sevdeskInvoiceId) {
			throw new AppError("No SevDesk invoice ID on record", 500);
		}

		const pdf = await sevdeskInvoicesService.getInvoicePdf(
			record.sevdeskInvoiceId,
		);

		const invoiceNumber =
			record.sevdeskInvoiceNumber ?? record.sevdeskInvoiceId;

		await emailService.sendInvoiceEmail({
			recipientEmail,
			organizerName: record.organizerName,
			invoiceNumber,
			eventName: record.eventName,
			pdfBase64: pdf.base64encoded,
			pdfFilename: pdf.filename,
		});

		const updated = await billingRecordsService.updateBillingRecord({
			organizerId,
			eventId,
			invoiceStatus: "SENT",
			emailSentAt: new Date().toISOString(),
		});

		revalidatePath(`/events/${eventId}`);

		return { success: true as const, data: updated };
	} catch (error) {
		return actionError(error, "Failed to send billing email");
	}
}

// ---------------------------------------------------------------------------
// initiateBillingPayout
// ---------------------------------------------------------------------------

export interface InitiatePayoutInput {
	organizerId: string;
	eventId: string;
	beneficiaryId: string;
	iban: string;
	beneficiaryName: string;
	bankAccountId: string;
}

export async function initiateBillingPayout(input: InitiatePayoutInput) {
	try {
		const record = await billingRecordsService.getBillingRecord(
			input.organizerId,
			input.eventId,
		);

		if (!record) {
			throw new AppError("Billing record not found", 404);
		}

		const allowedInvoiceStatuses: BillingRecord["invoiceStatus"][] = [
			"OPEN",
			"SENT",
			"PAID",
		];

		if (!allowedInvoiceStatuses.includes(record.invoiceStatus)) {
			throw new AppError(
				"Invoice must be finalized before initiating payout",
				409,
			);
		}

		if (record.payoutStatus !== "PENDING") {
			throw new AppError("Payout has already been initiated", 409);
		}

		const accessToken = await getAccessToken();

		// Use SDK createSepaTransfer generator (handles VoP + transfer in one flow)
		const generator = sepaTransfers.createSepaTransfer({
			sepaTransferSettings: {
				bankAccountId: input.bankAccountId,
				beneficiaryId: input.beneficiaryId,
				amount: record.payoutAmountCents / 100,
				reference: `Veranstaltung: ${record.eventName}`,
				note: `Auszahlung ${record.eventName}`,
			},
			operationSettings: { accessToken },
		});

		// Step 1: VoP check
		await generator.next();

		// Step 2: Accept VoP and create transfer
		const transferResult = await generator.next({ vopDecision: "ACCEPT" });
		const response = transferResult.value as
			| import("@qonto/embed-sdk/server/sepa-transfers").CreateSepaTransferResponse
			| undefined;
		const transferId = response?.transfer.id;

		if (!transferId) {
			throw new AppError("Transfer creation returned no ID", 500);
		}

		const updated = await billingRecordsService.updateBillingRecord({
			organizerId: input.organizerId,
			eventId: input.eventId,
			payoutStatus: "INITIATED",
			qontoTransferId: transferId,
			payoutInitiatedAt: new Date().toISOString(),
		});

		revalidatePath(`/events/${input.eventId}`);

		return { success: true as const, data: updated };
	} catch (error) {
		return actionError(error, "Failed to initiate payout");
	}
}
