"use server";

import { AppError } from "@/lib/errors";
import { SevdeskClient } from "@/lib/sevdesk/client";
import type { CreateInvoiceDraftInput } from "@/lib/sevdesk/services/invoices";
import { SevdeskInvoicesService } from "@/lib/sevdesk/services/invoices";

const sevdeskClient = new SevdeskClient();
const invoicesService = new SevdeskInvoicesService(sevdeskClient);

export async function createSevdeskInvoiceDraft(input: CreateInvoiceDraftInput) {
    try {
        const invoice = await invoicesService.createInvoiceDraft(input);

        return { success: true as const, data: invoice };
    } catch (error) {
        const message =
            error instanceof AppError || error instanceof Error
                ? error.message
                : "Failed to create invoice draft";

        console.error("createSevdeskInvoiceDraft error:", message);

        return { success: false as const, error: message };
    }
}
