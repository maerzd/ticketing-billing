import {
	SevdeskInputRefSchema,
	type SevdeskInvoice,
	SevdeskInvoiceCreateSchema,
	SevdeskInvoicePosCreateSchema,
	SevdeskSaveInvoiceResponseSchema,
	SevdeskSaveInvoiceSchema,
} from "@ticketing-billing/types/sevdesk";
import env from "@/env";
import { AppError } from "@/lib/errors";
import type { SevdeskClient } from "@/lib/sevdesk/client";

export interface CreateInvoiceDraftInput {
	/** Sevdesk contact ID for the organizer/customer */
	organizerContactId: number;
	/** Invoice date (ISO date string, e.g., "2025-03-29") */
	invoiceDate: string;
	/** Days until payment due (optional) */
	timeToPay?: number;
	/** Invoice line items */
	items: Array<{
		label: string;
		quantity: number;
		priceGross: number;

		taxRate: number;
	}>;
	/** Optional footer text */
	footText?: string;
}

export class SevdeskInvoicesService {
	constructor(private readonly client: SevdeskClient) {}

	private toNumericId(id: string | number, label: string) {
		const numeric = typeof id === "string" ? Number.parseInt(id, 10) : id;
		if (!Number.isFinite(numeric)) {
			throw new AppError(`Invalid sevdesk ${label} id: ${id}`, 500);
		}

		return numeric;
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
			objectName: "Unit",
		});
	}

	async createInvoiceDraft(
		input: CreateInvoiceDraftInput,
	): Promise<SevdeskInvoice> {
		const contactRef = SevdeskInputRefSchema.parse({
			id: this.toNumericId(input.organizerContactId, "organizer contact"),
			objectName: "Contact",
		});

		// Build invoice positions
		const invoicePositions = input.items.map((item) =>
			SevdeskInvoicePosCreateSchema.parse({
				objectName: "InvoicePos",
				mapAll: true,
				quantity: item.quantity,
				taxRate: item.taxRate,
				unity: this.unitRef(),
				name: item.label,
				priceGross: item.priceGross,
			}),
		);

		// Build invoice header
		const invoice = SevdeskInvoiceCreateSchema.parse({
			objectName: "Invoice",
			mapAll: true,
			invoiceDate: input.invoiceDate,
			contact: contactRef,
			contactPerson: this.contactPersonRef(),
			addressCountry: this.countryRef(),
			status: "100", // Draft
			discount: 0,
			taxRule: this.taxRuleRef(),
			taxText: "MwSt.",
			taxType: "default",
			invoiceType: "RE", // Standard invoice
			currency: "EUR",
			timeToPay: input.timeToPay,
			footText: input.footText,
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
}
