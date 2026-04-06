import { z } from "zod";
import { SevdeskInputRefSchema, SevdeskResponseRefSchema } from "./contact";

export const SevdeskInvoiceStatusSchema = z.enum([
	"50", // Draft
	"100", // Delivered
	"200", // Paid
	"750", // Partially paid
	"1000", // Cancelled
]);

export const SevdeskInvoiceTypeSchema = z.enum([
	"RE", // Standard invoice
	"WKR", // Recurring invoice
	"SR", // Credit note
	"MA", // Reminder
	"TR", // Partial invoice
	"AR", // Advance invoice
	"ER", // Final invoice
]);

export const SevdeskTaxTypeSchema = z.enum([
	"default", // Umsatzsteuer ausweisen
	"eu", // Steuerfreie innergemeinschaftliche Lieferung
	"noteu", // Steuerschuldnerschaft des Leistungsempfängers
	"custom", // Custom tax set
	"ss", // Not subject to VAT §19 1 UStG
]);

/** Tax rule for sevdesk-Update 2.0. Replaces taxType/taxSet. */
export const SevdeskTaxRuleSchema = z.object({
	id: z.enum(["1", "2", "3", "4", "5", "11", "17", "18", "19", "20", "21"]),
	objectName: z.literal("TaxRule"),
});

export const SevdeskInvoiceSendTypeSchema = z.enum([
	"VPR", // Printed
	"VPDF", // Downloaded
	"VM", // Mailed
	"VP", // Postal
]);

/**
 * Payload for POST /Invoice (or as part of saveInvoice factory).
 *
 * Required fields per the API spec:
 * invoiceDate, contact, discount, status, addressCountry, contactPerson,
 * taxRate, taxRule, taxText, taxType, invoiceType, currency, mapAll
 */
export const SevdeskInvoiceCreateSchema = z.object({
	objectName: z.literal("Invoice"),
	mapAll: z.literal(true),
	invoiceDate: z.string(),
	contact: SevdeskInputRefSchema,
	/**
	 * The sevdesk user acting as contact person for this invoice.
	 * Retrieve via GET /SevUser to find your account's user id.
	 */
	contactPerson: SevdeskInputRefSchema,
	addressCountry: SevdeskInputRefSchema,
	status: SevdeskInvoiceStatusSchema,
	/** No discount → 0 */
	discount: z.number().int().default(0),
	/** Deprecated, use taxRate on positions instead. Set to 0. */
	taxRate: z.number().default(0),
	taxRule: SevdeskTaxRuleSchema,
	taxText: z.string(),
	taxType: SevdeskTaxTypeSchema,
	invoiceType: SevdeskInvoiceTypeSchema,
	currency: z.string().length(3),
	header: z.string().nullable().optional(),
	headText: z.string().nullable().optional(),
	footText: z.string().nullable().optional(),
	timeToPay: z.number().int().nullable().optional(),
	address: z.string().nullable().optional(),
	deliveryDate: z.string().nullable().optional(),
	deliveryDateUntil: z.number().int().nullable().optional(),
	smallSettlement: z.boolean().nullable().optional(),
	showNet: z.boolean().nullable().optional(),
	customerInternalNote: z.string().nullable().optional(),
	invoiceNumber: z.string().nullable().optional(),
	paymentMethod: SevdeskInputRefSchema.optional(),
	sendType: SevdeskInvoiceSendTypeSchema.nullable().optional(),
	propertyIsEInvoice: z.boolean().nullable().optional(),
	/** Required for id field if updating existing invoice */
	id: z.number().int().nullable().optional(),
});

export const SevdeskInvoiceResponseSchema = z.object({
	id: z.string(),
	objectName: z.literal("Invoice"),
	invoiceNumber: z.string().nullable().optional(),
	contact: SevdeskResponseRefSchema,
	create: z.string().datetime().optional(),
	update: z.string().datetime().optional(),
	invoiceDate: z.string().nullable().optional(),
	header: z.string().nullable().optional(),
	headText: z.string().nullable().optional(),
	footText: z.string().nullable().optional(),
	timeToPay: z.string().nullable().optional(),
	discount: z.string().nullable().optional(),
	status: SevdeskInvoiceStatusSchema,
	smallSettlement: z.boolean().nullable().optional(),
	contactPerson: SevdeskResponseRefSchema,
	taxRate: z.string().nullable().optional(),
	taxText: z.string().nullable().optional(),
	taxType: SevdeskTaxTypeSchema.nullable().optional(),
	invoiceType: SevdeskInvoiceTypeSchema.nullable().optional(),
	currency: z.string().nullable().optional(),
	sumNet: z.string().nullable().optional(),
	sumTax: z.string().nullable().optional(),
	sumGross: z.string().nullable().optional(),
	paidAmount: z.number().nullable().optional(),
	showNet: z.boolean().nullable().optional(),
	sendType: SevdeskInvoiceSendTypeSchema.nullable().optional(),
	address: z.string().nullable().optional(),
	customerInternalNote: z.string().nullable().optional(),
	deliveryDate: z.string().nullable().optional(),
	payDate: z.string().nullable().optional(),
});

export const SevdeskCreateInvoiceResponseSchema = z.object({
	objects: z.object({
		invoice: SevdeskInvoiceResponseSchema,
	}),
});

export type SevdeskInvoiceStatus = z.infer<typeof SevdeskInvoiceStatusSchema>;
export type SevdeskInvoiceType = z.infer<typeof SevdeskInvoiceTypeSchema>;
export type SevdeskTaxType = z.infer<typeof SevdeskTaxTypeSchema>;
export type SevdeskTaxRule = z.infer<typeof SevdeskTaxRuleSchema>;
export type SevdeskInvoiceCreate = z.infer<typeof SevdeskInvoiceCreateSchema>;
export type SevdeskInvoice = z.infer<typeof SevdeskInvoiceResponseSchema>;
