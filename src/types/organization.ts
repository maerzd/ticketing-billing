import { z } from "zod";

export const QontoBankAccountSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    main: z.boolean(),
    iban: z.string().nullable().optional(),
    bic: z.string().nullable().optional(),
    currency: z.string().optional(),
    balance: z.float32().optional(),
    balance_cents: z.float32().optional(),
    authorized_balance: z.float32().optional(),
    authorized_balance_cents: z.int().optional(),
    is_external_account: z.boolean().optional(),
    account_number: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});
// Organization Types
export const QontoOrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    legal_name: z.string().nullable().optional(),
    locale: z.string(),
    legal_share_capital: z.number(),
    legal_country: z.string(),
    legal_registration_date: z.string().nullable().optional(),
    legal_form: z.string(),
    legal_address: z.string(),
    legal_sector: z.string().nullable().optional(),
    contract_signed_at: z.string().nullable().optional(),
    legal_number: z.string().nullable().optional(),
    bank_accounts: z.array(QontoBankAccountSchema),
    logo_url: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type QontoOrganization = z.infer<typeof QontoOrganizationSchema>;
export type QontoBankAccount = z.infer<typeof QontoBankAccountSchema>;

export const QontoOrganizationResponseSchema = z.object({
    organization: QontoOrganizationSchema,
});

export type QontoOrganizationResponse = z.infer<
    typeof QontoOrganizationResponseSchema
>;