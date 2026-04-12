import { z } from "zod";

export const OrganizerIdSchema = z
	.string()
	.min(5, "Veranstalter ID is required")
	.regex(
		/^org-[A-Za-z0-9][A-Za-z0-9_-]*$/,
		"Veranstalter ID must start with 'org-'",
	);

export const OrganizerStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const OrganizerBillingAddressSchema = z.object({
	street: z.string().min(1, "Rechnungsanschrift: Straße ist erforderlich"),
	city: z.string().min(1, "Rechnungsanschrift: Stadt ist erforderlich"),
	zipCode: z
		.string()
		.min(1, "Rechnungsanschrift: Postleitzahl ist erforderlich"),
	country: z.string().min(2, "Rechnungsanschrift: Land ist erforderlich"),
});

export const OrganizerFeeOverrideSchema = z.object({
	pctRate: z.number().min(0),
	perTicket: z.number().int().min(0),
	flat: z.number().int().min(0),
});

export const OrganizerContactPersonSchema = z.object({
	firstName: z.string().min(2, "Vorname ist erforderlich"),
	lastName: z.string().min(2, "Nachname ist erforderlich"),
	email: z.email("Ungültige E-Mail"),
	phone: z.string().optional(),
});

export const OrganizerRecordSchema = z.object({
	organizerId: OrganizerIdSchema,
	name: z.string().min(2, "Name ist erforderlich").optional(),
	email: z.email("Ungültige E-Mail"),
	billingAddress: OrganizerBillingAddressSchema,
	contactPersons: z.array(OrganizerContactPersonSchema).optional(),
	vatNumber: z
		.string()
		.min(1, "Umsatzsteuernummer ist erforderlich")
		.optional(),
	taxIdentificationNumber: z
		.string()
		.min(1, "Steuernummer ist erforderlich")
		.optional(),
	taxRate: z.number().min(0).max(1).default(0.19),
	sepaBeneficiaryName: z
		.string()
		.min(1, "SEPA-Empfänger ist erforderlich")
		.optional(),
	iban: z.string().min(1, "IBAN ist erforderlich").optional(),
	bic: z.string().min(1, "BIC ist erforderlich").optional(),
	sevdeskContactId: z.string().optional(),
	qontoBeneficiaryId: z.string().optional(),
	feeOverride: OrganizerFeeOverrideSchema.optional(),
	/** Default event tax rate (0–1), e.g. 0.07 for 7% */
	defaultEventTaxRate: z.number().min(0).max(1).optional(),
	/** Default setup fee in cents, e.g. 2500 for €25.00 */
	defaultSetupFee: z.number().int().min(0).optional(),
	/** Default ticket commission rate (0–1), e.g. 0.10 for 10% */
	defaultTicketCommissionRate: z.number().min(0).max(1).optional(),
	status: OrganizerStatusSchema.default("ACTIVE"),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const CreateOrganizerInputSchema = OrganizerRecordSchema.omit({
	createdAt: true,
	updatedAt: true,
});

export const UpdateOrganizerInputSchema = CreateOrganizerInputSchema.partial()
	.extend({ organizerId: OrganizerIdSchema })
	.refine((value) => Object.keys(value).length > 1, {
		message: "At least one field must be updated",
	});

export type OrganizerStatus = z.infer<typeof OrganizerStatusSchema>;
export type OrganizerBillingAddress = z.infer<
	typeof OrganizerBillingAddressSchema
>;
export type OrganizerContactPerson = z.infer<
	typeof OrganizerContactPersonSchema
>;
export type OrganizerRecord = z.infer<typeof OrganizerRecordSchema>;
export type CreateOrganizerInput = z.infer<typeof CreateOrganizerInputSchema>;
export type UpdateOrganizerInput = z.infer<typeof UpdateOrganizerInputSchema>;
