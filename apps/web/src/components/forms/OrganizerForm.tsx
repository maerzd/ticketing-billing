"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	type CreateOrganizerInput,
	CreateOrganizerInputSchema,
	type OrganizerRecord,
	type OrganizerStatus,
} from "@ticketing-billing/types/ddb";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const TAX_RATE_VALUES = ["0", "0.07", "0.19"] as const;

/**
 * Form schema: picks field validators from OrganizerRecordSchema where possible,
 * overrides fields that need string representation (taxRate, feeOverride),
 * and flattens contactPersons[0] into top-level contact* fields.
 */
const s = CreateOrganizerInputSchema.shape;

const OrganizerFormSchema = z.object({
	organizerId: s.organizerId,
	name: s.name.unwrap().or(z.literal("")),
	email: s.email,
	status: s.status.removeDefault(),
	vatNumber: s.vatNumber.unwrap().or(z.literal("")),
	taxIdentificationNumber: s.taxIdentificationNumber.unwrap().or(z.literal("")),
	sepaBeneficiaryName: s.sepaBeneficiaryName.unwrap().or(z.literal("")),
	iban: s.iban.unwrap().or(z.literal("")),
	bic: s.bic.unwrap().or(z.literal("")),
	billingAddress: s.billingAddress,
	sevdeskContactId: s.sevdeskContactId.unwrap().or(z.literal("")),
	qontoBeneficiaryId: s.qontoBeneficiaryId.unwrap().or(z.literal("")),
	workosOrganizationId: s.workosOrganizationId.unwrap().or(z.literal("")),
	// UI-specific: string representation for select/number inputs
	taxRate: z.enum(TAX_RATE_VALUES),
	contactFirstName: z.string(),
	contactLastName: z.string(),
	contactEmail: z.string(),
	contactPhone: z.string(),
	feeOverride: z.object({
		pctRate: z.string(),
		perTicket: z.string(),
		flat: z.string(),
	}),
});

type OrganizerFormValues = z.infer<typeof OrganizerFormSchema>;

/** Convert form values → CreateOrganizerInput for submission. */
function formToInput(values: OrganizerFormValues): CreateOrganizerInput {
	const trimToOptional = (v: string | undefined) => {
		const t = v?.trim();
		return t && t.length > 0 ? t : undefined;
	};

	const trimToOptionalNumber = (v: string) => {
		const t = v.trim();
		if (!t) return undefined;
		const n = Number(t);
		return Number.isFinite(n) ? n : undefined;
	};

	const contactFirstName = trimToOptional(values.contactFirstName);
	const contactLastName = trimToOptional(values.contactLastName);
	const contactEmail = trimToOptional(values.contactEmail);
	const contactPhone = trimToOptional(values.contactPhone);

	const feePctRate = trimToOptionalNumber(values.feeOverride.pctRate);
	const feePerTicket = trimToOptionalNumber(values.feeOverride.perTicket);
	const feeFlat = trimToOptionalNumber(values.feeOverride.flat);
	const hasAnyFee =
		feePctRate !== undefined ||
		feePerTicket !== undefined ||
		feeFlat !== undefined;

	return {
		organizerId: values.organizerId,
		name: trimToOptional(values.name),
		email: values.email,
		status: values.status,
		vatNumber: trimToOptional(values.vatNumber),
		taxIdentificationNumber: trimToOptional(values.taxIdentificationNumber),
		taxRate: Number(values.taxRate),
		sepaBeneficiaryName: trimToOptional(values.sepaBeneficiaryName),
		iban: trimToOptional(values.iban),
		bic: trimToOptional(values.bic),
		billingAddress: values.billingAddress,
		sevdeskContactId: trimToOptional(values.sevdeskContactId),
		qontoBeneficiaryId: trimToOptional(values.qontoBeneficiaryId),
		workosOrganizationId: trimToOptional(values.workosOrganizationId),
		contactPersons:
			contactFirstName || contactLastName || contactEmail || contactPhone
				? [
						{
							firstName: contactFirstName ?? "",
							lastName: contactLastName ?? "",
							email: contactEmail ?? "",
							phone: contactPhone,
						},
					]
				: undefined,
		feeOverride: hasAnyFee
			? {
					pctRate: feePctRate ?? 0,
					perTicket: Math.round(feePerTicket ?? 0),
					flat: Math.round(feeFlat ?? 0),
				}
			: undefined,
	};
}

const normalizeTaxRateForForm = (
	value: number,
): OrganizerFormValues["taxRate"] => {
	if (value <= 0) return "0";
	if (value <= 0.07) return "0.07";
	return "0.19";
};

export const defaultOrganizerFormValues = (): OrganizerFormValues => ({
	organizerId: "org-",
	name: "",
	email: "",
	status: "ACTIVE" as OrganizerStatus,
	vatNumber: "",
	taxIdentificationNumber: "",
	taxRate: "0.19",
	sepaBeneficiaryName: "",
	iban: "",
	bic: "",
	billingAddress: { street: "", city: "", zipCode: "", country: "DE" },
	sevdeskContactId: "",
	qontoBeneficiaryId: "",
	workosOrganizationId: "",
	contactFirstName: "",
	contactLastName: "",
	contactEmail: "",
	contactPhone: "",
	feeOverride: { pctRate: "", perTicket: "", flat: "" },
});

export const organizerToFormValues = (
	organizer: OrganizerRecord,
): OrganizerFormValues => {
	const c = organizer.contactPersons?.[0];
	return {
		organizerId: organizer.organizerId,
		name: organizer.name ?? "",
		email: organizer.email,
		status: organizer.status ?? "ACTIVE",
		vatNumber: organizer.vatNumber ?? "",
		taxIdentificationNumber: organizer.taxIdentificationNumber ?? "",
		taxRate: normalizeTaxRateForForm(organizer.taxRate),
		sepaBeneficiaryName: organizer.sepaBeneficiaryName ?? "",
		iban: organizer.iban ?? "",
		bic: organizer.bic ?? "",
		billingAddress: organizer.billingAddress,
		sevdeskContactId: organizer.sevdeskContactId ?? "",
		qontoBeneficiaryId: organizer.qontoBeneficiaryId ?? "",
		workosOrganizationId: organizer.workosOrganizationId ?? "",
		contactFirstName: c?.firstName ?? "",
		contactLastName: c?.lastName ?? "",
		contactEmail: c?.email ?? "",
		contactPhone: c?.phone ?? "",
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
	};
};

interface OrganizerFormProps {
	initialValues: OrganizerFormValues;
	onSubmit: (values: CreateOrganizerInput) => void;
	disabled?: boolean;
	hideOrganizerId?: boolean;
	formId: string;
}

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
		values: initialValues,
	});

	const handleSubmit = form.handleSubmit((values) => {
		setSubmitError(null);
		const input = formToInput(values);
		const parsed = CreateOrganizerInputSchema.safeParse(input);
		if (!parsed.success) {
			setSubmitError(
				parsed.error.issues[0]?.message ??
					"Bitte korrigiere die markierten Felder.",
			);
			return;
		}
		onSubmit(parsed.data);
	});

	const organizerIdValue = form.watch("organizerId");
	const organizerIdInvalid =
		organizerIdValue.trim().length > 0 &&
		!organizerIdValue.trim().startsWith("org-");
	const qontoBeneficiaryIdValue = form.watch("qontoBeneficiaryId")?.trim();
	const sevdeskContactIdValue = form.watch("sevdeskContactId")?.trim();
	const workosOrganizationIdValue = form.watch("workosOrganizationId")?.trim();
	const sevdeskContactUrl = sevdeskContactIdValue
		? `https://my.sevdesk.de/crm/detail/id/${sevdeskContactIdValue}`
		: null;
	const workosOrganizationUrl = workosOrganizationIdValue
		? `https://dashboard.workos.com/organizations/${workosOrganizationIdValue}`
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
					<Controller
						name="organizerId"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={field.name}>
									Veranstalter ID (nicht veränderbar!)
								</FieldLabel>
								<Input
									{...field}
									id={field.name}
									disabled={disabled}
									placeholder="org-some-organizer"
									aria-invalid={fieldState.invalid}
								/>
								{organizerIdInvalid && (
									<p className="mt-1 text-red-600 text-xs">
										Veranstalter ID muss mit &quot;org-&quot; beginnen
									</p>
								)}
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				)}

				<FieldGroup className="space-y-3">
					<FieldLegend>Allgemeine Informationen</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormInput
							name="name"
							label="Name des Veranstalters (optional)"
							placeholder="Kulturverein e.V."
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="email"
							label="Email"
							type="email"
							control={form.control}
							disabled={disabled}
						/>
					</div>
				</FieldGroup>

				<FieldGroup>
					<FieldLegend>Ansprechpartner</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormInput
							name="contactFirstName"
							label="Vorname"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="contactLastName"
							label="Nachname"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="contactEmail"
							label="Email"
							type="email"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="contactPhone"
							label="Telefon"
							control={form.control}
							disabled={disabled}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Steuer und Auszahlung</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormInput
							name="vatNumber"
							label="Umsatzsteuer-Id"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="taxIdentificationNumber"
							label="Steuernummer"
							control={form.control}
							disabled={disabled}
						/>
						<Controller
							name="taxRate"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>Steuersatz</FieldLabel>
									<select
										id={field.name}
										disabled={disabled}
										className="block h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
									>
										{taxRateOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<FormInput
							name="sepaBeneficiaryName"
							label="SEPA Begünstigter"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="iban"
							label="IBAN"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="bic"
							label="BIC"
							control={form.control}
							disabled={disabled}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Rechnungsanschrift</FieldLegend>
					<div className="grid gap-4 md:grid-cols-2">
						<FormInput
							name="billingAddress.street"
							label="Straße und Hausnummer"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="billingAddress.zipCode"
							label="Postleitzahl"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="billingAddress.city"
							label="Stadt"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="billingAddress.country"
							label="Land"
							placeholder="DE"
							control={form.control}
							disabled={disabled}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Sonderkonditionen (optional)</FieldLegend>
					<div className="grid gap-4 md:grid-cols-3">
						<FormInput
							name="feeOverride.pctRate"
							label="Percent rate"
							type="number"
							placeholder="0.1"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="feeOverride.perTicket"
							label="Per ticket (cents)"
							type="number"
							placeholder="100"
							control={form.control}
							disabled={disabled}
						/>
						<FormInput
							name="feeOverride.flat"
							label="Flat fee (cents)"
							type="number"
							placeholder="5000"
							control={form.control}
							disabled={disabled}
						/>
					</div>
				</FieldGroup>

				<FieldSeparator />

				<FieldGroup>
					<FieldLegend>Systemreferenzen (automatisch generiert)</FieldLegend>
					<div className="grid gap-4 md:grid-cols-3">
						<Controller
							name="qontoBeneficiaryId"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>
										Qonto beneficiary ID
									</FieldLabel>
									<Input
										{...field}
										id={field.name}
										disabled={disabled}
										aria-invalid={fieldState.invalid}
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
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name="sevdeskContactId"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>
										sevdesk contact ID
									</FieldLabel>
									<Input
										{...field}
										id={field.name}
										disabled={disabled}
										aria-invalid={fieldState.invalid}
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
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name="workosOrganizationId"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>
										WorkOS organization ID
									</FieldLabel>
									<Input
										{...field}
										id={field.name}
										disabled={disabled}
										aria-invalid={fieldState.invalid}
									/>
									{workosOrganizationUrl && (
										<a
											href={workosOrganizationUrl}
											target="_blank"
											rel="noreferrer"
											className="mt-1 inline-block text-blue-600 text-xs hover:underline"
										>
											Open in WorkOS
										</a>
									)}
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</div>
				</FieldGroup>

				{submitError && <p className="text-red-600 text-sm">{submitError}</p>}
			</FieldGroup>
		</form>
	);
}

/** Generic Controller-based input field following shadcn Field/FieldError pattern. */
function FormInput({
	name,
	label,
	control,
	disabled,
	placeholder,
	type,
}: {
	name: string;
	label: string;
	control: ReturnType<typeof useForm<OrganizerFormValues>>["control"];
	disabled?: boolean;
	placeholder?: string;
	type?: React.ComponentProps<typeof Input>["type"];
}) {
	return (
		<Controller
			name={name as keyof OrganizerFormValues}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
					<Input
						{...field}
						value={field.value as string}
						id={field.name}
						type={type}
						disabled={disabled}
						placeholder={placeholder}
						aria-invalid={fieldState.invalid}
					/>
					{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
				</Field>
			)}
		/>
	);
}
