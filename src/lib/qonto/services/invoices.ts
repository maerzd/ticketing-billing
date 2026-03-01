import { z } from "zod";
import type { QontoClient } from "@/lib/qonto/client";
import { ClientInvoiceSchema, ListClientInvoicesSchema } from "@/types/invoice";

const CreateInvoiceSchema = z.object({
	client_name: z.string().min(1),
	amount_in_cents: z.number().int().positive(),
	description: z.string().min(1),
	invoice_date: z.iso.date(),
	due_date: z.iso.date().optional(),
	currency: z.string().default("EUR"),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

export class InvoicesService {
	constructor(private readonly client: QontoClient) {}

	async createInvoice(input: CreateInvoiceInput) {
		const validated = CreateInvoiceSchema.parse(input);

		return this.client.post("/client_invoices", ClientInvoiceSchema, {
			client_name: validated.client_name,
			amount_in_cents: validated.amount_in_cents,
			description: validated.description,
			invoice_date: validated.invoice_date,
			due_date: validated.due_date,
			currency: validated.currency,
		});
	}

	async listInvoices(page: number = 1, per_page: number = 25) {
		return this.client.get("/client_invoices", ListClientInvoicesSchema, {
			page,
			per_page,
		});
	}
}
