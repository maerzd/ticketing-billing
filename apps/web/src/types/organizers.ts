import { z } from "zod";

export const OrganizerIdSchema = z
    .string()
    .min(5, "Veranstalter ID is required")
    .regex(/^org-[A-Za-z0-9][A-Za-z0-9_-]*$/, "Veranstalter ID must start with 'org-'");

export const OrganizerStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const OrganizerBillingAddressSchema = z.object({
    street_address: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    zip_code: z.string().min(1, "ZIP code is required"),
    country: z.string().min(2, "Country is required"),
});

export const OrganizerFeeOverrideSchema = z.object({
    pct_rate: z.number().min(0),
    per_ticket: z.number().int().min(0),
    flat: z.number().int().min(0),
});

export const OrganizerRecordSchema = z.object({
    organizerid: OrganizerIdSchema,
    name: z.string().min(1, "Name is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.email("Invalid email"),
    billing_address: OrganizerBillingAddressSchema,
    vat_number: z.string().min(1, "VAT number is required"),
    tax_identification_number: z
        .string()
        .min(1, "Tax identification number is required"),
    tax_rate: z.number().int().min(0),
    iban: z.string().min(1, "IBAN is required"),
    bic: z.string().min(1, "BIC is required"),
    qonto_client_id: z.string().optional(),
    qonto_beneficiary_id: z.string().optional(),
    fee_override: OrganizerFeeOverrideSchema.optional(),
    status: OrganizerStatusSchema,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export const CreateOrganizerInputSchema = OrganizerRecordSchema.omit({
    created_at: true,
    updated_at: true,
});

export const UpdateOrganizerInputSchema = CreateOrganizerInputSchema.partial()
    .extend({ organizerid: OrganizerIdSchema })
    .refine((value) => Object.keys(value).length > 1, {
        message: "At least one field must be updated",
    });

export type OrganizerStatus = z.infer<typeof OrganizerStatusSchema>;
export type OrganizerRecord = z.infer<typeof OrganizerRecordSchema>;
export type CreateOrganizerInput = z.infer<typeof CreateOrganizerInputSchema>;
export type UpdateOrganizerInput = z.infer<typeof UpdateOrganizerInputSchema>;
