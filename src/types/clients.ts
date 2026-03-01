import { z } from "zod";
import { QontoMetaSchema } from "./shared";

const AddressSchema = z.object({
	street_address: z.string().optional(),
	city: z.string().optional(),
	zip_code: z.string().optional(),
	province_code: z.string().optional(),
	country_code: z.string().optional(),
});

const PhoneSchema = z.object({
	country_code: z.string(),
	number: z.string(),
});

export const ClientSchema = z.object({
	id: z.uuid(),
	name: z.string().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	phone: PhoneSchema.optional(),
	kind: z.string(),
	type: z.string(),
	email: z.string().optional(),
	extra_emails: z.array(z.string()),
	currency: z.string(),
	e_invoicing_address: z.string().optional(),
	vat_number: z.string().optional(),
	tax_identification_number: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	zip_code: z.string().optional(),
	province_code: z.string().optional(),
	country_code: z.string().optional(),
	billing_address: AddressSchema.optional(),
	delivery_address: AddressSchema.optional(),
	recipient_code: z.string().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
	locale: z.string().optional(),
});

export const ListClientsResponseSchema = z.object({
	clients: z.array(ClientSchema),
	meta: QontoMetaSchema,
});

export type Client = z.infer<typeof ClientSchema>;
export type ListClientsResponse = z.infer<typeof ListClientsResponseSchema>;
