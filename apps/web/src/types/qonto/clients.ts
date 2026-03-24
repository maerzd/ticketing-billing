import { z } from "zod";

export const QontoClientKindSchema = z.enum([
	"individual",
	"company",
	"freelancer",
]);

export const ClientAddressSchema = z.object({
	street_address: z.string().optional(),
	city: z.string().optional(),
	zip_code: z.string().optional(),
	province_code: z.string().optional(),
	country_code: z.string().optional(),
});

export const ClientPhoneSchema = z.object({
	country_code: z.string(),
	number: z.string(),
});

export const ClientSchema = z.object({
	id: z.uuid(),
	name: z.string().nullable().optional(),
	first_name: z.string().nullable().optional(),
	last_name: z.string().nullable().optional(),
	phone: ClientPhoneSchema.nullable().optional(),
	kind: QontoClientKindSchema,
	type: QontoClientKindSchema.optional(),
	email: z.string().nullable().optional(),
	extra_emails: z.array(z.string()).nullable().optional(),
	currency: z.string().nullable().optional(),
	e_invoicing_address: z.string().nullable().optional(),
	vat_number: z.string().nullable().optional(),
	tax_identification_number: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	zip_code: z.string().nullable().optional(),
	province_code: z.string().nullable().optional(),
	country_code: z.string().nullable().optional(),
	billing_address: ClientAddressSchema.nullable().optional(),
	delivery_address: ClientAddressSchema.nullable().optional(),
	recipient_code: z.string().nullable().optional(),
	created_at: z.string().nullable().optional(),
	updated_at: z.string().nullable().optional(),
	locale: z.string().nullable().optional(),
});

export const QontoClientMetaSchema = z.object({
	current_page: z.number().int(),
	next_page: z.number().int().nullable().optional(),
	prev_page: z.number().int().nullable().optional(),
	previous_page: z.number().int().nullable().optional(),
	total_pages: z.number().int(),
	total_count: z.number().int(),
	per_page: z.number().int(),
});

export const ListClientsResponseSchema = z.object({
	clients: z.array(ClientSchema),
	meta: QontoClientMetaSchema,
});

const BaseClientInputSchema = z.object({
	name: z.string().max(250).optional(),
	first_name: z.string().max(60).optional(),
	last_name: z.string().max(60).optional(),
	email: z.string().email().max(250).optional(),
	extra_emails: z
		.array(z.string().email().max(250))
		.max(100)
		.nullable()
		.optional(),
	phone: ClientPhoneSchema.optional(),
	e_invoicing_address: z.string().optional(),
	vat_number: z.string().max(20).optional(),
	tax_identification_number: z.string().max(20).optional(),
	billing_address: ClientAddressSchema.optional(),
	delivery_address: ClientAddressSchema.optional(),
	recipient_code: z.string().optional(),
	currency: z.string().length(3).optional(),
	locale: z.string().min(2).max(5).optional(),
});

export const CreateClientInputSchema = BaseClientInputSchema.extend({
	kind: QontoClientKindSchema,
}).superRefine((value, ctx) => {
	if (value.kind === "company" && !value.name) {
		ctx.addIssue({
			code: "custom",
			path: ["name"],
			message: "Company clients require a name",
		});
	}

	if (
		(value.kind === "individual" || value.kind === "freelancer") &&
		(!value.first_name || !value.last_name)
	) {
		ctx.addIssue({
			code: "custom",
			path: ["first_name"],
			message: "Individual and freelancer clients require first and last name",
		});
	}
});

export const UpdateClientInputSchema = BaseClientInputSchema;

export const RetrieveClientResponseSchema = z.object({
	client: ClientSchema,
});

export const CreateClientResponseSchema = z.object({
	client: ClientSchema,
});

export const UpdateClientResponseSchema = z.object({
	client: ClientSchema,
});

export type Client = z.infer<typeof ClientSchema>;
export type ListClientsResponse = z.infer<typeof ListClientsResponseSchema>;
export type CreateClientInput = z.infer<typeof CreateClientInputSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientInputSchema>;
