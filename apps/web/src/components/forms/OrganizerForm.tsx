"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	type CreateOrganizerInput,
	CreateOrganizerInputSchema,
	type OrganizerRecord,
	type OrganizerStatus,
} from "@ticketing-billing/types/ddb";
import { useEffect, useMemo, useState } from "react";
import {
	type FieldPath,
	type UseFormRegisterReturn,
	useForm,
} from "react-hook-form";
import { z } from "zod";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const TAX_RATE_VALUES = ["0", "0.07", "0.19"] as const;

export const OrganizerFormSchema = z.object({
	organizerId: z.string(),
	name: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.string(),
	status: z.custom<OrganizerStatus>(),
	vatNumber: z.string(),
	taxIdentificationNumber: z.string(),
	taxRate: z.enum(TAX_RATE_VALUES),
	sepaBeneficiaryName: z.string(),
	iban: z.string(),
	bic: z.string(),
	billingAddress: z.object({
		firstName: z.string(),
		lastName: z.string(),
		street: z.string(),
		city: z.string(),
		zipCode: z.string(),
		country: z.string(),
	}),
	sevdeskContactId: z.string(),
	qontoBeneficiaryId: z.string(),
	feeOverride: z.object({
		pctRate: z.string(),
		perTicket: z.string(),
		flat: z.string(),
	}),
});

export const OrganizerFormToCreateInputSchema = OrganizerFormSchema.transform(
	(values) => {
		const trimToOptional = (value: string) => {
			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : undefined;
		};

		const trimToOptionalNumber = (value: string) => {
			const trimmed = value.trim();
			if (!trimmed) {
				return undefined;
			}

			const parsed = Number(trimmed);
			return Number.isFinite(parsed) ? parsed : undefined;
		};

		const feePctRate = trimToOptionalNumber(values.feeOverride.pctRate);
		const feePerTicket = trimToOptionalNumber(values.feeOverride.perTicket);
		const feeFlat = trimToOptionalNumber(values.feeOverride.flat);

		const hasAnyFeeOverride =
			feePctRate !== undefined ||
			feePerTicket !== undefined ||
			feeFlat !== undefined;

		return {
			organizerId: values.organizerId.trim(),
			name: trimToOptional(values.name),
			firstName: trimToOptional(values.firstName),
			lastName: trimToOptional(values.lastName),
			email: values.email.trim(),
			status: values.status,
			vatNumber: trimToOptional(values.vatNumber),
			taxIdentificationNumber: trimToOptional(values.taxIdentificationNumber),
			taxRate: Number(values.taxRate),
			sepaBeneficiaryName: trimToOptional(values.sepaBeneficiaryName),
			iban: trimToOptional(values.iban),
			bic: trimToOptional(values.bic),
			billingAddress: {
				firstName: values.billingAddress.firstName.trim(),
				lastName: values.billingAddress.lastName.trim(),
				street: values.billingAddress.street.trim(),
				city: values.billingAddress.city.trim(),
				zipCode: values.billingAddress.zipCode.trim(),
				country: values.billingAddress.country.trim(),
			},
			sevdeskContactId: trimToOptional(values.sevdeskContactId),
			qontoBeneficiaryId: trimToOptional(values.qontoBeneficiaryId),
			feeOverride: hasAnyFeeOverride
				? {
						pctRate: feePctRate ?? 0,
						perTicket: Math.round(feePerTicket ?? 0),
						flat: Math.round(feeFlat ?? 0),
					}
				: undefined,
		};
	},
);

export type OrganizerFormValues = z.infer<typeof OrganizerFormSchema>;

interface OrganizerFormProps {
	initialValues: OrganizerFormValues;
	onSubmit: (values: CreateOrganizerInput) => void;
	disabled?: boolean;
	hideOrganizerId?: boolean;
	formId: string;
}

export const generateOrganizerId = () => {
	const random = Math.random().toString(36).slice(2, 10);
	return `org-${random}`;
};

export const defaultOrganizerFormValues = (): OrganizerFormValues => ({
	organizerId: generateOrganizerId(),
	name: "",
	firstName: "",
	lastName: "",
	email: "",
	status: "ACTIVE",
	vatNumber: "",
	taxIdentificationNumber: "",
	taxRate: "0.19",
	sepaBeneficiaryName: "",
	iban: "",
	bic: "",
	billingAddress: {
		firstName: "",
		lastName: "",
		street: "",
		city: "",
		zipCode: "",
		country: "DE",
	},
	sevdeskContactId: "",
	qontoBeneficiaryId: "",
	feeOverride: {
		pctRate: "",
		perTicket: "",
		flat: "",
	},
});

const normalizeTaxRateForForm = (
	value: number,
): OrganizerFormValues["taxRate"] => {
	if (value <= 0) {
		return "0";
	}

	if (value <= 0.07) {
		return "0.07";
	}

	return "0.19";
};

export const organizerToFormValues = (
	organizer: OrganizerRecord,
): OrganizerFormValues => ({
	organizerId: organizer.organizerId,
	name: organizer.name ?? "",
	firstName: organizer.firstName ?? "",
	lastName: organizer.lastName ?? "",
	email: organizer.email,
	status: organizer.status ?? "ACTIVE",
	vatNumber: organizer.vatNumber ?? "",
	taxIdentificationNumber: organizer.taxIdentificationNumber ?? "",
	taxRate: normalizeTaxRateForForm(organizer.taxRate),
	sepaBeneficiaryName: organizer.sepaBeneficiaryName ?? "",
	iban: organizer.iban ?? "",
	bic: organizer.bic ?? "",
	billingAddress: {
		firstName: organizer.billingAddress.firstName,
		lastName: organizer.billingAddress.lastName,
		street: organizer.billingAddress.street,
		city: organizer.billingAddress.city,
		zipCode: organizer.billingAddress.zipCode,
		country: organizer.billingAddress.country,
	},
	sevdeskContactId: organizer.sevdeskContactId ?? "",
	qontoBeneficiaryId: organizer.qontoBeneficiaryId ?? "",
	feeOverride: {
		pctRate:
			organizer.feeOverride?.pctRate !== undefined
				? String(organizer.feeOverride.pctRate)
				: "",
		perTicket:
			organizer.feeOverride?.perTicket !== undefined
				? String(organizer.feeOverride.perTicket)
				: "",
		flat:
			organizer.feeOverride?.flat !== undefined
				? String(organizer.feeOverride.flat)
				: "",
	},
});

interface FormFieldProps {
	id: string;
	label: string;
	error?: string;
	disabled?: boolean;
	placeholder?: string;
	type?: React.ComponentProps<typeof Input>["type"];
	registration: UseFormRegisterReturn;
}

const FormField = ({
	id,
	label,
	error,
	disabled,
	placeholder,
	type,
	registration,
}: Readonly<FormFieldProps>) => (
	<Field>
		<FieldLabel htmlFor={id}>{label}</FieldLabel>
		<Input
			id={id}
			type={type}
			disabled={disabled}
			placeholder={placeholder}
			{...registration}
		/>
		{error && <p className="mt-1 text-red-600 text-xs">{error}</p>}
	</Field>
);

export function OrganizerForm({
	initialValues,
	onSubmit,
	disabled = false,
	hideOrganizerId = false,
	formId,
}: Readonly<OrganizerFormProps>) {
	const qontoBeneficiariesUrl =
		"https://app.qonto.com/organizations/zunftick-gbr-9639/flows/sepa-transfer/beneficiaries";
	const [submitError, setSubmitError] = useState<string | null>(null);
	const form = useForm<OrganizerFormValues>({
		resolver: zodResolver(OrganizerFormSchema),
		defaultValues: initialValues,
	});

	useEffect(() => {
		form.reset(initialValues);
		setSubmitError(null);
	}, [form, initialValues]);

	const organizerIdValue = form.watch("organizerId");
	const organizerIdInvalid =
		organizerIdValue.trim().length > 0 &&
		!organizerIdValue.trim().startsWith("org-");

	const handleSubmit = form.handleSubmit((values) => {
		form.clearErrors();
		setSubmitError(null);

		const transformed = OrganizerFormToCreateInputSchema.safeParse(values);
		if (!transformed.success) {
			for (const issue of transformed.error.issues) {
				form.setError(issue.path.join(".") as FieldPath<OrganizerFormValues>, {
					type: "manual",
					message: issue.message,
				});
			}
			setSubmitError("Bitte korrigiere die markierten Felder.");
			return;
		}

		const parsed = CreateOrganizerInputSchema.safeParse(transformed.data);
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				form.setError(issue.path.join(".") as FieldPath<OrganizerFormValues>, {
					type: "manual",
					message: issue.message,
				});
			}
			setSubmitError(
				parsed.error.issues[0]?.message ??
					"Bitte korrigiere die markierten Felder.",
			);
			return;
		}

		onSubmit(parsed.data);
	});

	const errors = form.formState.errors;
	const qontoBeneficiaryIdValue = form.watch("qontoBeneficiaryId").trim();
	const sevdeskContactIdValue = form.watch("sevdeskContactId").trim();
	const sevdeskContactUrl = sevdeskContactIdValue
		? `https://my.sevdesk.de/crm/detail/id/${sevdeskContactIdValue}`
		: null;

	const taxRateOptions = useMemo(
		() => [
			{ label: "0%", value: "0" },
			{ label: "7%", value: "0.07" },
			{ label: "19%", value: "0.19" },
		],
		[],
	);

	return (
		<form id={formId} onSubmit={handleSubmit}>
			<FieldGroup className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
				{!hideOrganizerId && (
					<Field>
						<FieldLabel htmlFor="organizerId">Veranstalter ID</FieldLabel>
						<Input
							id="organizerId"
							disabled={disabled}
							placeholder="org-some-organizer"
							{...form.register("organizerId")}
						/>
						{organizerIdInvalid && (
							<p className="mt-1 text-red-600 text-xs">
								Veranstalter ID muss mit "org-" beginnen
							</p>
						)}
						{errors.organizerId?.message && (
							<p className="mt-1 text-red-600 text-xs">
								{errors.organizerId.message}
							</p>
						)}
					</Field>
				)}

				<FieldGroup className="space-y-3">
					<FieldLegend>Allgemeine Informationen</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							id="organizer-name"
							label="Name des Veranstalters (optional)"
							disabled={disabled}
							placeholder="Kulturverein e.V."
							registration={form.register("name")}
							error={errors.name?.message}
						/>
						<FormField
							id="organizer-email"
							label="Email"
							type="email"
							disabled={disabled}
							registration={form.register("email")}
							error={errors.email?.message}
						/>
					</div>
				</FieldGroup>

				<FieldGroup>
					<FieldLegend>Ansprechpartner</FieldLegend>
					<div className="grid gap-4 md:grid-cols-3">
						<FormField
							id="contact-first-name"
							label="Vorname"
							disabled={disabled}
							registration={form.register("firstName")}
							error={errors.firstName?.message}
						/>
						<FormField
							id="contact-last-name"
							label="Nachname"
							disabled={disabled}
							registration={form.register("lastName")}
							error={errors.lastName?.message}
						/>
						<FormField
							id="contact-email"
							label="Email"
							type="email"
							disabled={disabled}
							registration={form.register("email")}
							error={errors.email?.message}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />
				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Steuer und Auszahlung</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							id="organizer-vat-number"
							label="Umsatzsteuer-Id"
							disabled={disabled}
							registration={form.register("vatNumber")}
							error={errors.vatNumber?.message}
						/>
						<FormField
							id="organizer-tax-identification-number"
							label="Steuernummer"
							disabled={disabled}
							registration={form.register("taxIdentificationNumber")}
							error={errors.taxIdentificationNumber?.message}
						/>
						<Field>
							<FieldLabel htmlFor="organizer-tax-rate">Steuersatz</FieldLabel>
							<select
								id="organizer-tax-rate"
								disabled={disabled}
								className="block h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
								{...form.register("taxRate")}
							>
								{taxRateOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</Field>
						<FormField
							id="organizer-sepa-beneficiary-name"
							label="SEPA Begünstigter"
							disabled={disabled}
							registration={form.register("sepaBeneficiaryName")}
							error={errors.sepaBeneficiaryName?.message}
						/>
						<FormField
							id="organizer-iban"
							label="IBAN"
							disabled={disabled}
							registration={form.register("iban")}
							error={errors.iban?.message}
						/>
						<FormField
							id="organizer-bic"
							label="BIC"
							disabled={disabled}
							registration={form.register("bic")}
							error={errors.bic?.message}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Rechnungsanschrift</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							id="organizer-billing-first-name"
							label="Vorname"
							disabled={disabled}
							registration={form.register("billingAddress.firstName")}
							error={errors.billingAddress?.firstName?.message}
						/>
						<FormField
							id="organizer-billing-last-name"
							label="Nachname"
							disabled={disabled}
							registration={form.register("billingAddress.lastName")}
							error={errors.billingAddress?.lastName?.message}
						/>
						<FormField
							id="organizer-billing-street"
							label="Straße und Hausnummer"
							disabled={disabled}
							registration={form.register("billingAddress.street")}
							error={errors.billingAddress?.street?.message}
						/>
						<FormField
							id="organizer-billing-city"
							label="Stadt"
							disabled={disabled}
							registration={form.register("billingAddress.city")}
							error={errors.billingAddress?.city?.message}
						/>
						<FormField
							id="organizer-billing-zip"
							label="Postleitzahl"
							disabled={disabled}
							registration={form.register("billingAddress.zipCode")}
							error={errors.billingAddress?.zipCode?.message}
						/>
						<FormField
							id="organizer-billing-country"
							label="Land"
							disabled={disabled}
							placeholder="DE"
							registration={form.register("billingAddress.country")}
							error={errors.billingAddress?.country?.message}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Sonderkonditionen (optional)</FieldLegend>
					<div className="grid gap-4 md:grid-cols-3">
						<FormField
							id="organizer-fee-pct-rate"
							label="Percent rate"
							type="number"
							disabled={disabled}
							placeholder="0.1"
							registration={form.register("feeOverride.pctRate")}
							error={errors.feeOverride?.pctRate?.message}
						/>
						<FormField
							id="organizer-fee-per-ticket"
							label="Per ticket (cents)"
							type="number"
							disabled={disabled}
							placeholder="100"
							registration={form.register("feeOverride.perTicket")}
							error={errors.feeOverride?.perTicket?.message}
						/>
						<FormField
							id="organizer-fee-flat"
							label="Flat fee (cents)"
							type="number"
							disabled={disabled}
							placeholder="5000"
							registration={form.register("feeOverride.flat")}
							error={errors.feeOverride?.flat?.message}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Systemreferenzen (automatisch generiert)</FieldLegend>
					<div className="grid gap-4 md:grid-cols-3">
						<Field>
							<FieldLabel htmlFor="organizer-qonto-beneficiary-id">
								Qonto beneficiary ID
							</FieldLabel>
							<Input
								id="organizer-qonto-beneficiary-id"
								disabled={disabled}
								{...form.register("qontoBeneficiaryId")}
							/>
							{qontoBeneficiaryIdValue && (
								<a
									href={qontoBeneficiariesUrl}
									target="_blank"
									rel="noreferrer"
									className="mt-1 inline-block text-blue-600 text-xs hover:underline"
								>
									Open in Qonto beneficiaries
								</a>
							)}
							{errors.qontoBeneficiaryId?.message && (
								<p className="mt-1 text-red-600 text-xs">
									{errors.qontoBeneficiaryId.message}
								</p>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor="organizer-sevdesk-customer-id">
								sevdesk contact ID
							</FieldLabel>
							<Input
								id="organizer-sevdesk-customer-id"
								disabled={disabled}
								{...form.register("sevdeskContactId")}
							/>
							{sevdeskContactUrl && (
								<a
									href={sevdeskContactUrl}
									target="_blank"
									rel="noreferrer"
									className="mt-1 inline-block text-blue-600 text-xs hover:underline"
								>
									Open in sevdesk
								</a>
							)}
							{errors.sevdeskContactId?.message && (
								<p className="mt-1 text-red-600 text-xs">
									{errors.sevdeskContactId.message}
								</p>
							)}
						</Field>
					</div>
				</FieldGroup>

				{submitError && <p className="text-red-600 text-sm">{submitError}</p>}
			</FieldGroup>
		</form>
	);
}
