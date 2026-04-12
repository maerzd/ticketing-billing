import {
	SevdeskGetInvoiceResponseSchema,
	SevdeskInputRefSchema,
	type SevdeskInvoice,
	SevdeskInvoiceCreateSchema,
	type SevdeskInvoicePdfResponse,
	SevdeskInvoicePdfResponseSchema,
	SevdeskInvoicePosCreateSchema,
	SevdeskInvoicePositionsResponseSchema,
	SevdeskNextInvoiceNumberResponseSchema,
	SevdeskSaveInvoiceResponseSchema,
	SevdeskSaveInvoiceSchema,
	SevdeskSendByResponseSchema,
} from "@ticketing-billing/types/sevdesk";
import env from "@/env";
import { AppError } from "@/lib/errors";
import type { SevdeskClient } from "@/lib/sevdesk/client";

export interface CreateInvoiceDraftInput {
	/** Sevdesk contact ID for the organizer/customer */
	organizerContactId: string;
	/** Invoice date (ISO date string, e.g., "2025-03-29") */
	invoiceDate: string;
	/** Days until payment due (optional) */
	timeToPay?: number;
	/** Invoice line items */
	items: Array<{
		name: string;
		quantity: number;
		price: number;
		taxRate: number;
	}>;
	header?: string;
	headText?: string;
	footText?: string;
	addressName?: string;
	addressStreet?: string;
	addressZip?: string;
	addressCity?: string;
	addressCountry?: string;
	address?: string;
}

export class SevdeskInvoicesService {
	constructor(private readonly client: SevdeskClient) {}

	private toPercentageString(value: number) {
		if (value < 0 || value > 100) {
			throw new AppError(`Invalid percentage value: ${value}`, 400);
		}
		return (value * 100).toFixed(1);
	}

	private countryRef() {
		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_COUNTRY_ID,
			objectName: "StaticCountry",
		});
	}

	private contactPersonRef() {
		if (!env.SEVDESK_CONTACT_PERSON_ID) {
			throw new AppError(
				"SEVDESK_CONTACT_PERSON_ID environment variable is required to create invoices. Retrieve your sevdesk user ID via GET /SevUser endpoint.",
				500,
			);
		}

		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_CONTACT_PERSON_ID,
			objectName: "SevUser",
		});
	}

	private taxRuleRef() {
		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_TAX_RULE_ID,
			objectName: "TaxRule",
		});
	}

	private unitRef() {
		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_INVOICE_UNIT_ID,
			objectName: "Unity",
		});
	}

	async createInvoiceDraft(
		input: CreateInvoiceDraftInput,
	): Promise<SevdeskInvoice> {
		const contactRef = SevdeskInputRefSchema.parse({
			id: input.organizerContactId,
			objectName: "Contact",
		});

		// fetch next invoice number.
		const invoiceNumber = await this.client
			.get(
				"/SevSequence/Factory/getByType",
				SevdeskNextInvoiceNumberResponseSchema,
				{ objectType: "Invoice", type: "RE" },
			)
			.then((res) => res.objects.nextSequence);

		// Build invoice positions
		const invoicePositions = input.items.map((item) =>
			SevdeskInvoicePosCreateSchema.parse({
				objectName: "InvoicePos",
				mapAll: true,
				quantity: item.quantity,
				taxRate: this.toPercentageString(item.taxRate),
				unity: this.unitRef(),
				name: item.name,
				price: item.price,
			}),
		);

		// Build invoice header
		const invoice = SevdeskInvoiceCreateSchema.parse({
			invoiceNumber: invoiceNumber,
			objectName: "Invoice",
			mapAll: true,
			invoiceDate: input.invoiceDate,
			contact: contactRef,
			contactPerson: this.contactPersonRef(),
			status: "100", // Draft
			discount: 0,
			taxRule: this.taxRuleRef(),
			taxText: "Mwst.",
			taxType: "default",
			invoiceType: "RE", // Standard invoice
			currency: "EUR",
			timeToPay: input.timeToPay,
			header: input.header,
			headText: input.headText,
			footText: input.footText,
			addressName: input.addressName,
			addressStreet: input.addressStreet,
			addressZip: input.addressZip,
			addressCity: input.addressCity,
			addressCountry: this.countryRef(),
			address: input.address,

			// Additional fields can be added as needed
		});

		// Build combined save payload
		const payload = SevdeskSaveInvoiceSchema.parse({
			invoice,
			invoicePosSave: invoicePositions,
		});

		// Create invoice atomically with all positions
		const response = await this.client.post(
			"/Invoice/Factory/saveInvoice",
			SevdeskSaveInvoiceResponseSchema,
			payload,
		);

		return response.objects.invoice;
	}

	async updateInvoiceDraft(
		invoiceId: string,
		input: CreateInvoiceDraftInput,
	): Promise<SevdeskInvoice> {
		// Fetch existing positions so we can pass them for deletion
		const existingPosResponse = await this.client.get(
			`/Invoice/${invoiceId}/getPositions`,
			SevdeskInvoicePositionsResponseSchema,
			{},
		);

		const existingPositions = existingPosResponse.objects;

		// Build new positions
		const invoicePositions = input.items.map((item) =>
			SevdeskInvoicePosCreateSchema.parse({
				objectName: "InvoicePos",
				mapAll: true,
				quantity: item.quantity,
				taxRate: this.toPercentageString(item.taxRate),
				unity: this.unitRef(),
				name: item.name,
				price: item.price,
			}),
		);

		// Mark old positions for deletion (comma-separated IDs in a single object)
		const posToDelete =
			existingPositions.length > 0
				? {
						id: existingPositions.map((p) => p.id).join(","),
						objectName: "InvoicePos",
					}
				: undefined;

		const contactRef = SevdeskInputRefSchema.parse({
			id: input.organizerContactId,
			objectName: "Contact",
		});

		const invoice = SevdeskInvoiceCreateSchema.parse({
			id: invoiceId,
			objectName: "Invoice",
			mapAll: true,
			invoiceDate: input.invoiceDate,
			contact: contactRef,
			contactPerson: this.contactPersonRef(),
			status: "100", // keep as Draft
			discount: 0,
			taxRule: this.taxRuleRef(),
			taxText: "Mwst.",
			taxType: "default",
			invoiceType: "RE",
			currency: "EUR",
			timeToPay: input.timeToPay,
			header: input.header,
			headText: input.headText,
			footText: input.footText,
			addressName: input.addressName,
			addressStreet: input.addressStreet,
			addressZip: input.addressZip,
			addressCity: input.addressCity,
			addressCountry: this.countryRef(),
			address: input.address,
		});

		const payload = SevdeskSaveInvoiceSchema.parse({
			invoice,
			invoicePosSave: invoicePositions,
			invoicePosDelete: posToDelete ?? null,
		});

		const response = await this.client.post(
			"/Invoice/Factory/saveInvoice",
			SevdeskSaveInvoiceResponseSchema,
			payload,
		);

		return response.objects.invoice;
	}

	/**
	 * Finalizes an invoice draft via the SevDesk sendBy endpoint.
	 *
	 * @param sendDraft - When `true`, a test send that does NOT change the invoice status
	 *                    (useful for previewing without finalizing). When `false` (default),
	 *                    the invoice is officially finalized (status → 200 / Delivered).
	 */
	async finalizeInvoice(
		invoiceId: string,
		sendDraft = false,
	): Promise<SevdeskInvoice> {
		const response = await this.client.put(
			`/Invoice/${invoiceId}/sendBy`,
			SevdeskSendByResponseSchema,
			{ sendType: "VPDF", sendDraft },
		);

		return response.objects;
	}

	async getInvoicePdf(
		invoiceId: string,
	): Promise<SevdeskInvoicePdfResponse["objects"]> {
		const response = await this.client.get(
			`/Invoice/${invoiceId}/getPdf`,
			SevdeskInvoicePdfResponseSchema,
			{ download: "true", preventSendBy: "true" },
		);

		return response.objects;
	}

	async getInvoiceById(invoiceId: string): Promise<SevdeskInvoice> {
		const response = await this.client.get(
			`/Invoice/${invoiceId}`,
			SevdeskGetInvoiceResponseSchema,
			{},
		);

		return response.objects;
	}
}
