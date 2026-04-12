import env from "@/env";
import { AppError } from "@/lib/errors";
import { getResendClient } from "@/lib/resend/client";

export interface SendInvoiceEmailInput {
    recipientEmail: string;
    organizerName: string;
    invoiceNumber: string;
    eventName: string;
    /** PDF content as base64-encoded string */
    pdfBase64: string;
    pdfFilename: string;
}

export class ResendEmailService {
    async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<string> {
        const client = getResendClient();

        const subject = `Ihre Rechnung ${input.invoiceNumber} – ${input.eventName}`;

        const body = `Sehr geehrte Damen und Herren,

im Anhang finden Sie Ihre Rechnung ${input.invoiceNumber} für die Veranstaltung „${input.eventName}".

Mit freundlichen Grüßen
Ihr zünftick-Team`;

        const { data, error } = await client.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: input.recipientEmail,
            subject,
            text: body,
            attachments: [
                {
                    filename: input.pdfFilename,
                    content: input.pdfBase64,
                },
            ],
        });

        if (error) {
            throw new AppError(`Failed to send email: ${error.message}`, 500);
        }

        if (!data?.id) {
            throw new AppError("Resend returned no message ID", 500);
        }

        return data.id;
    }
}
