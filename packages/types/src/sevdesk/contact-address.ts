import { z } from "zod";
import { SevdeskInputRefSchema, SevdeskResponseRefSchema } from "./contact";

/**
 * Payload for POST /ContactAddress.
 *
 * `contact` and `country` are required. `category` is also required by the
 * API when creating (use e.g. { id: 43, objectName: "Category" } for postal
 * address category – look up via GET /Category?objectType=ContactAddress).
 */
export const SevdeskContactAddressCreateSchema = z.object({
	contact: SevdeskInputRefSchema,
	country: SevdeskInputRefSchema,
	category: SevdeskInputRefSchema,
	street: z.string().nullable().optional(),
	zip: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	/** Name shown on the address (e.g. company name). */
	name: z.string().nullable().optional(),
	name2: z.string().nullable().optional(),
	name3: z.string().nullable().optional(),
	name4: z.string().nullable().optional(),
});

export const SevdeskContactAddressResponseSchema = z.object({
	id: z.coerce.string(),
	objectName: z.literal("ContactAddress"),
	// sevdesk returns "YYYY-MM-DD HH:mm:ss" (non-ISO), so keep these lenient.
	create: z.string().optional(),
	update: z.string().optional(),
	contact: SevdeskResponseRefSchema,
	country: SevdeskResponseRefSchema,
	category: SevdeskResponseRefSchema.nullable().optional(),
	street: z.string().nullable().optional(),
	zip: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
	name2: z.string().nullable().optional(),
	name3: z.string().nullable().optional(),
	name4: z.string().nullable().optional(),
});

export const SevdeskCreateContactAddressResponseSchema = z.object({
	objects: SevdeskContactAddressResponseSchema,
});

export const SevdeskListContactAddressesResponseSchema = z.object({
	objects: z
		.union([
			z.array(SevdeskContactAddressResponseSchema),
			SevdeskContactAddressResponseSchema,
			z.null(),
		])
		.transform((value) => {
			if (!value) {
				return [];
			}

			return Array.isArray(value) ? value : [value];
		}),
});

export type SevdeskContactAddressCreate = z.infer<
	typeof SevdeskContactAddressCreateSchema
>;
export type SevdeskContactAddress = z.infer<
	typeof SevdeskContactAddressResponseSchema
>;
