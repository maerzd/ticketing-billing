import type { z } from "zod";
import type { QontoClient } from "@/lib/qonto/client";
import {
	CreateClientInvoiceResponseSchema,
	QontoCreateClientInvoiceSchema,
} from "@/types/qonto/create-invoice";
import { ListClientInvoicesSchema } from "@/types/qonto/invoice";

export type CreateInvoiceInput = z.infer<typeof QontoCreateClientInvoiceSchema>;

export class InvoicesService {
	constructor(private readonly client: QontoClient) {}

	async createInvoice(input: CreateInvoiceInput) {
		const validatedBody = QontoCreateClientInvoiceSchema.parse(input);
		return this.client.post(
			"/client_invoices",
			CreateClientInvoiceResponseSchema,
			validatedBody,
		);
	}

	async listInvoices(page: number = 1, per_page: number = 25) {
		return this.client.get("/client_invoices", ListClientInvoicesSchema, {
			page,
			per_page,
		});
	}
}
