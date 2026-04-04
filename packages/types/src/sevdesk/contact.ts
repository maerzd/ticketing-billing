import { z } from "zod";

/** Shared inline reference used throughout sevdesk API payloads */
export const SevdeskInputRefSchema = z.object({
	id: z.number().int(),
	objectName: z.string(),
});

/** Shared inline reference returned in sevdesk API responses */
export const SevdeskResponseRefSchema = z.object({
	id: z.string(),
	objectName: z.string(),
});

export const SevdeskContactStatusSchema = z.union([
	z.literal(100), // Lead
	z.literal(500), // Pending
	z.literal(1000), // Active
]);

/**
 * Payload for POST /Contact.
 *
 * In sevdesk, both an organisation and a contact person are modelled as a
 * Contact. An organisation contact has `name` set (and no `surename`). A
 * contact person has `surename`/`familyname` set and `parent` pointing at the
 * organisation contact.
 */
export const SevdeskContactCreateSchema = z.object({
	/** Organisation name – set this to treat the contact as a company. */
	name: z.string().nullable().optional(),
	/** First name – for individual/contact-person contacts. */
	surename: z.string().nullable().optional(),
	/** Last name – for individual/contact-person contacts. */
	familyname: z.string().nullable().optional(),
	/**
	 * Category of the contact.
	 * Common values: { id: 3, objectName: "Category" } = Customer
	 */
	category: SevdeskInputRefSchema,
	/**
	 * Parent contact – required when creating a contact person that belongs
	 * to an organisation contact.
	 */
	parent: SevdeskInputRefSchema.nullable().optional(),
	status: SevdeskContactStatusSchema.nullable().optional(),
	customerNumber: z.string().nullable().optional(),
	vatNumber: z.string().nullable().optional(),
	taxNumber: z.string().nullable().optional(),
	bankAccount: z.string().nullable().optional(),
	bankNumber: z.string().nullable().optional(),
	defaultTimeToPay: z.number().int().nullable().optional(),
	exemptVat: z.boolean().nullable().optional(),
	buyerReference: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
});

export const SevdeskContactResponseSchema = z.object({
	id: z.string(),
	objectName: z.literal("Contact"),
	// sevdesk often returns "YYYY-MM-DD HH:mm:ss" (non-ISO), so keep these lenient.
	create: z.string().optional(),
	update: z.string().optional(),
	name: z.string().nullable().optional(),
	surename: z.string().nullable().optional(),
	familyname: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
	customerNumber: z.string().nullable().optional(),
	parent: SevdeskResponseRefSchema.nullable().optional(),
	category: SevdeskResponseRefSchema.nullable().optional(),
	vatNumber: z.string().nullable().optional(),
	taxNumber: z.string().nullable().optional(),
	bankAccount: z.string().nullable().optional(),
	bankNumber: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	buyerReference: z.string().nullable().optional(),
	exemptVat: z.string().nullable().optional(),
});

export const SevdeskGetContactsResponseSchema = z.object({
	objects: z.array(SevdeskContactResponseSchema),
});

export const SevdeskCreateContactResponseSchema = z.object({
	objects: SevdeskContactResponseSchema,
});

export type SevdeskContactStatus = z.infer<typeof SevdeskContactStatusSchema>;
export type SevdeskContactCreate = z.infer<typeof SevdeskContactCreateSchema>;
export type SevdeskContact = z.infer<typeof SevdeskContactResponseSchema>;
