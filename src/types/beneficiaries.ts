import { z } from "zod";

export const QontoSepaBeneficiarySchema = z.object({
    id: z.string(),
    name: z.string(),
    iban: z.string().nullable(),
    bic: z.string().nullable(),
    status: z.string(),
    trusted: z.boolean(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    email: z.string().nullable(),
    activity_tag: z.string().nullable(),
});

export type QontoSepaBeneficiary = z.infer<typeof QontoSepaBeneficiarySchema>;

export const QontoSepaBeneficiaryListSchema = z.object({
    beneficiaries: z.array(QontoSepaBeneficiarySchema),
    meta: z.object({
        current_page: z.number(),
        next_page: z.number().optional().nullable(),
        prev_page: z.number().optional().nullable(),
        total_pages: z.number(),
        total_count: z.number(),
        per_page: z.number(),
    }),
});

export type QontoSepaBeneficiaryList = z.infer<
    typeof QontoSepaBeneficiaryListSchema
>;

export const QontoCreateSepaBeneficiarySchema = z.object({
    name: z.string().min(1),
    iban: z.string().min(1),
    bic: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    activity_tag: z.string().optional().nullable(),
});

export type CreateSepaBeneficiaryInput = z.infer<
    typeof QontoCreateSepaBeneficiarySchema
>;

export const QontoSepaBeneficiaryResponseSchema = z.object({
    beneficiary: QontoSepaBeneficiarySchema,
});

export const QontoSepaBeneficiaryBatchResponseSchema = z.object({
    beneficiaries: z.array(QontoSepaBeneficiarySchema),
});

export const QontoBeneficiaryIdsSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(400),
});

export type QontoBeneficiaryIdsInput = z.infer<
    typeof QontoBeneficiaryIdsSchema
>;
