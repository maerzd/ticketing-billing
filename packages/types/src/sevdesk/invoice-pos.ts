import { z } from "zod";
import { SevdeskInputRefSchema } from "./contact";
import {
    SevdeskInvoiceCreateSchema,
    SevdeskInvoiceResponseSchema,
} from "./invoice";

/**
 * A single invoice position for POST /InvoicePos or as part of saveInvoice.
 *
 * Required: unity, taxRate, quantity, objectName, mapAll
 */
export const SevdeskInvoicePosCreateSchema = z.object({
    objectName: z.literal("InvoicePos"),
    mapAll: z.literal(true),
    quantity: z.number(),
    taxRate: z.number(),
    unity: SevdeskInputRefSchema,
    name: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    priceGross: z.number().nullable().optional(),
    priceTax: z.number().nullable().optional(),
    discount: z.number().nullable().optional(),
    positionNumber: z.number().int().nullable().optional(),
    part: SevdeskInputRefSchema.optional(),
    /** Required when updating an existing position */
    id: z.number().int().nullable().optional(),
});

export const SevdeskInvoicePosResponseSchema = z.object({
    id: z.string(),
    objectName: z.literal("InvoicePos"),
    create: z.string().datetime().optional(),
    update: z.string().datetime().optional(),
    quantity: z.number().nullable().optional(),
    price: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    discount: z.number().nullable().optional(),
    taxRate: z.number().nullable().optional(),
    positionNumber: z.number().int().nullable().optional(),
    priceNet: z.number().nullable().optional(),
    priceGross: z.number().nullable().optional(),
    priceTax: z.number().nullable().optional(),
    sumDiscount: z.number().nullable().optional(),
    sumNetAccounting: z.number().nullable().optional(),
    sumTaxAccounting: z.number().nullable().optional(),
    sumGrossAccounting: z.number().nullable().optional(),
});

/**
 * Combined payload for POST /Invoice/Factory/saveInvoice.
 * Creates invoice and positions in a single request.
 */
export const SevdeskSaveInvoiceSchema = z.object({
    invoice: SevdeskInvoiceCreateSchema,
    invoicePosSave: z.array(SevdeskInvoicePosCreateSchema),
    invoicePosDelete: z
        .object({
            id: z.number().int(),
            objectName: z.string(),
        })
        .nullable()
        .optional(),
    filename: z.string().optional(),
});

export const SevdeskSaveInvoiceResponseSchema = z.object({
    objects: z.object({
        invoice: SevdeskInvoiceResponseSchema,
        invoicePos: z.array(SevdeskInvoicePosResponseSchema).optional(),
    }),
});

export type SevdeskInvoicePosCreate = z.infer<
    typeof SevdeskInvoicePosCreateSchema
>;
export type SevdeskInvoicePos = z.infer<typeof SevdeskInvoicePosResponseSchema>;
export type SevdeskSaveInvoice = z.infer<typeof SevdeskSaveInvoiceSchema>;
