"use server";

import type { BillingRecord } from "@ticketing-billing/types/ddb";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth";
import { calculateBillingAmounts } from "@/lib/billing-calculator";
import { BillingRecordsService } from "@/lib/dynamodb/services/billing-records";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import { OrganizationService } from "@/lib/qonto/services/organization";
import { TransfersService } from "@/lib/qonto/services/transfers";
import { ResendEmailService } from "@/lib/resend/services/email";
import { SevdeskClient } from "@/lib/sevdesk/client";
import { SevdeskInvoicesService } from "@/lib/sevdesk/services/invoices";

const billingRecordsService = new BillingRecordsService();
const sevdeskClient = new SevdeskClient();
const sevdeskInvoicesService = new SevdeskInvoicesService(sevdeskClient);
const emailService = new ResendEmailService();

function actionError(error: unknown, fallback: string) {
	const message =
		error instanceof AppError || error instanceof Error
			? error.message
			: fallback;
	console.error(fallback, message);
	return { success: false as const, error: message };
}

// ---------------------------------------------------------------------------
// createBillingDraft
// ---------------------------------------------------------------------------

export interface CreateBillingDraftInput {
	organizerId: string;
	eventId: string;
	eventName: string;
	organizerName: string;
	organizerContactId: string;
	organizerEmail: string;
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

export async function createBillingDraft(input: CreateBillingDraftInput) {
	try {
		// Guard: no existing record
		const existing = await billingRecordsService.getBillingRecord(
			input.organizerId,
			input.eventId,
		);

		if (existing) {
			throw new AppError("A billing record for this event already exists", 409);
		}

		const officialPosSet = new Set(input.officialPos);
		const amounts = calculateBillingAmounts({
			totalRevenue: input.totalRevenue,
			ticketsCount: input.ticketsCount,
			revenuePerPos: input.revenuePerPos,
			officialPos: officialPosSet,
			eventTaxRate: input.eventTaxRate,
			setupFee: input.setupFee,
			ticketCommissionRate: input.ticketCommissionRate,
		});

		const invoiceItems = [
			{
				label: "Systemgebühr",
				netValue: amounts.systemFee,
				value: amounts.systemFeeWithTax,
				tax: 0.19,
			},
			{
				label: "Vorverkaufsgebühr",
				netValue: amounts.variableFee,
				value: amounts.variableFeeWithTax,
				tax: input.eventTaxRate,
			},
			{
				label: "Einrichtungsgebühr",
				netValue: input.setupFee,
				value: amounts.setupFeeWithTax,
				tax: 0.19,
			},
		];

		const invoice = await sevdeskInvoicesService.createInvoiceDraft({
			organizerContactId: input.organizerContactId,
			invoiceDate: input.invoiceDate,
			timeToPay: 14,
			items: invoiceItems.map((item) => ({
				name: item.label,
				quantity: 1,
				price: item.value,
				taxRate: item.tax,
			})),
			header: "Rechnung Nr. [%RECHNUNGSNUMMER%]",
			headText:
				"<p>\n    Sehr geehrte Damen und Herren,\n</p>\n<p>\n    wir erlauben uns, von den Einnahmen Ihrer Veranstaltung unsere Gebühren abzuziehen und zahlen den Restbetrag an Sie aus. Im Folgenden finden Sie eine detaillierte Ausführung der einzelnen Positionen.\n</p>",
			footText: input.invoiceFootHtml,
			addressName: input.organizerAddressName,
			addressStreet: input.organizerAddressStreet,
			addressZip: input.organizerAddressZip,
			addressCity: input.organizerAddressCity,
			addressCountry: input.organizerAddressCountry,
			address: input.organizerAddressName
				? `${input.organizerAddressName}\n${input.organizerAddressStreet ?? ""}\n${input.organizerAddressZip ?? ""} ${input.organizerAddressCity ?? ""}`
				: undefined,
		});

		const record = await billingRecordsService.createBillingRecord({
			organizerId: input.organizerId,
			eventId: input.eventId,
			eventName: input.eventName,
			organizerName: input.organizerName,
			invoiceStatus: "DRAFT",
			payoutStatus: "PENDING",
			sevdeskInvoiceId: invoice.id,
			sevdeskInvoiceNumber: invoice.invoiceNumber ?? undefined,
			eventTaxRate: input.eventTaxRate,
			setupFee: Math.round(input.setupFee * 100),
			ticketCommissionRate: input.ticketCommissionRate,
			officialPos: input.officialPos,
			totalRevenueCents: amounts.totalRevenueCents,
			invoiceAmountCents: amounts.invoiceAmountCents,
			invoiceNetCents: amounts.invoiceNetCents,
			payoutAmountCents: amounts.payoutAmountCents,
			ticketsCount: input.ticketsCount,
			revenueOrganizerCents: amounts.revenueOrganizerCents,
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

export interface UpdateBillingDraftInput {
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

		const officialPosSet = new Set(input.officialPos);
		const amounts = calculateBillingAmounts({
			totalRevenue: input.totalRevenue,
			ticketsCount: input.ticketsCount,
			revenuePerPos: input.revenuePerPos,
			officialPos: officialPosSet,
			eventTaxRate: input.eventTaxRate,
			setupFee: input.setupFee,
			ticketCommissionRate: input.ticketCommissionRate,
		});

		await sevdeskInvoicesService.updateInvoiceDraft(record.sevdeskInvoiceId, {
			organizerContactId: input.organizerContactId,
			invoiceDate: input.invoiceDate,
			timeToPay: 14,
			items: [
				{
					name: "Systemgebühr",
					quantity: 1,
					price: amounts.systemFeeWithTax,
					taxRate: 0.19,
				},
				{
					name: "Vorverkaufsgebühr",
					quantity: 1,
					price: amounts.variableFeeWithTax,
					taxRate: input.eventTaxRate,
				},
				{
					name: "Einrichtungsgebühr",
					quantity: 1,
					price: amounts.setupFeeWithTax,
					taxRate: 0.19,
				},
			],
			header: "Rechnung Nr. [%RECHNUNGSNUMMER%]",
			headText:
				"<p>\n    Sehr geehrte Damen und Herren,\n</p>\n<p>\n    wir erlauben uns, von den Einnahmen Ihrer Veranstaltung unsere Gebühren abzuziehen und zahlen den Restbetrag an Sie aus. Im Folgenden finden Sie eine detaillierte Ausführung der einzelnen Positionen.\n</p>",
			footText: input.invoiceFootHtml,
			addressName: input.organizerAddressName,
			addressStreet: input.organizerAddressStreet,
			addressZip: input.organizerAddressZip,
			addressCity: input.organizerAddressCity,
			addressCountry: input.organizerAddressCountry,
			address: input.organizerAddressName
				? `${input.organizerAddressName}\n${input.organizerAddressStreet ?? ""}\n${input.organizerAddressZip ?? ""} ${input.organizerAddressCity ?? ""}`
				: undefined,
		});

		const updated = await billingRecordsService.updateBillingRecord({
			organizerId: input.organizerId,
			eventId: input.eventId,
			eventTaxRate: input.eventTaxRate,
			setupFee: Math.round(input.setupFee * 100),
			ticketCommissionRate: input.ticketCommissionRate,
			officialPos: input.officialPos,
			totalRevenueCents: amounts.totalRevenueCents,
			invoiceAmountCents: amounts.invoiceAmountCents,
			invoiceNetCents: amounts.invoiceNetCents,
			payoutAmountCents: amounts.payoutAmountCents,
			ticketsCount: input.ticketsCount,
			revenueOrganizerCents: amounts.revenueOrganizerCents,
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
	vopProofToken: string;
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
		const qontoClient = new QontoClient({ accessToken });
		const transfersService = new TransfersService(qontoClient);

		const transfer = await transfersService.createTransfer({
			beneficiary_id: input.beneficiaryId,
			amount_in_cents: record.payoutAmountCents,
			label: `Auszahlung ${record.eventName}`,
			reference: `Veranstaltung: ${record.eventName}`,
			vop_proof_token: input.vopProofToken,
			bank_account_id: input.bankAccountId,
		});

		const updated = await billingRecordsService.updateBillingRecord({
			organizerId: input.organizerId,
			eventId: input.eventId,
			payoutStatus: "INITIATED",
			qontoTransferId: transfer.id,
			payoutInitiatedAt: new Date().toISOString(),
		});

		revalidatePath(`/events/${input.eventId}`);

		return { success: true as const, data: updated };
	} catch (error) {
		return actionError(error, "Failed to initiate payout");
	}
}

// ---------------------------------------------------------------------------
// fetchQontoBankAccounts — helper for payout dialog
// ---------------------------------------------------------------------------

export async function fetchQontoBankAccounts() {
	try {
		const accessToken = await getAccessToken();
		const qontoClient = new QontoClient({ accessToken });
		const orgService = new OrganizationService(qontoClient);
		const org = await orgService.getOrganization();

		return {
			success: true as const,
			data: org.organization.bank_accounts,
		};
	} catch (error) {
		return actionError(error, "Failed to fetch bank accounts");
	}
}
