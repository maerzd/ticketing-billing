"use server";

import { getAccessToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import type { CreateInvoiceInput } from "@/lib/qonto/services/invoices";
import { InvoicesService } from "@/lib/qonto/services/invoices";

/**
 * Create a new client invoice
 */
export async function createInvoice(input: CreateInvoiceInput) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new InvoicesService(client);

		const invoice = await service.createInvoice(input);

		return {
			success: true,
			data: invoice,
		};
	} catch (error) {
		const message =
			error instanceof AppError ? error.message : "Failed to create invoice";

		return {
			success: false,
			error: message,
		};
	}
}
