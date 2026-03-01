import { z } from "zod";
export const QontoMetaSchema = z.object({
	current_page: z.number().int(),
	next_page: z.number().int().nullable(),
	previous_page: z.number().int().nullable(),
	total_pages: z.number().int(),
	total_count: z.number().int(),
	per_page: z.number().int(),
});
