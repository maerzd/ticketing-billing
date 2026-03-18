"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
	CreateOrganizerInput,
	OrganizerRecord,
	OrganizerStatus,
	UpdateOrganizerInput,
} from "@/types/organizers";

export interface OrganizerFormValues {
	organizerid: string;
	name: string;
	first_name: string;
	last_name: string;
	email: string;
	status: OrganizerStatus;
	vat_number: string;
	tax_identification_number: string;
	tax_rate: string;
	iban: string;
	bic: string;
	billing_street_address: string;
	billing_city: string;
	billing_zip_code: string;
	billing_country: string;
	qonto_client_id: string;
	qonto_beneficiary_id: string;
	fee_pct_rate: string;
	fee_per_ticket: string;
	fee_flat: string;
}

interface OrganizerFormProps {
	values: OrganizerFormValues;
	onChange: (values: OrganizerFormValues) => void;
	disabled?: boolean;
	hideOrganizerId?: boolean;
}

const toOptional = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const toOptionalNumber = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return undefined;
	}

	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : undefined;
};

export const generateOrganizerId = () => {
	const random = Math.random().toString(36).slice(2, 10);
	return `org-${random}`;
};

export const defaultOrganizerFormValues = (): OrganizerFormValues => ({
	organizerid: generateOrganizerId(),
	name: "",
	first_name: "",
	last_name: "",
	email: "",
	status: "ACTIVE",
	vat_number: "",
	tax_identification_number: "",
	tax_rate: "19",
	iban: "",
	bic: "",
	billing_street_address: "",
	billing_city: "",
	billing_zip_code: "",
	billing_country: "DE",
	qonto_client_id: "",
	qonto_beneficiary_id: "",
	fee_pct_rate: "",
	fee_per_ticket: "",
	fee_flat: "",
});

export const organizerToFormValues = (
	organizer: OrganizerRecord,
): OrganizerFormValues => ({
	organizerid: organizer.organizerid,
	name: organizer.name,
	first_name: organizer.first_name,
	last_name: organizer.last_name,
	email: organizer.email,
	status: organizer.status,
	vat_number: organizer.vat_number,
	tax_identification_number: organizer.tax_identification_number,
	tax_rate: String(organizer.tax_rate),
	iban: organizer.iban,
	bic: organizer.bic,
	billing_street_address: organizer.billing_address.street_address,
	billing_city: organizer.billing_address.city,
	billing_zip_code: organizer.billing_address.zip_code,
	billing_country: organizer.billing_address.country,
	qonto_client_id: organizer.qonto_client_id ?? "",
	qonto_beneficiary_id: organizer.qonto_beneficiary_id ?? "",
	fee_pct_rate: organizer.fee_override?.pct_rate
		? String(organizer.fee_override.pct_rate)
		: "",
	fee_per_ticket: organizer.fee_override?.per_ticket
		? String(organizer.fee_override.per_ticket)
		: "",
	fee_flat: organizer.fee_override?.flat
		? String(organizer.fee_override.flat)
		: "",
});

export const formValuesToCreateInput = (
	values: OrganizerFormValues,
): CreateOrganizerInput => {
	const taxRate = Number.parseInt(values.tax_rate, 10);

	const feePctRate = toOptionalNumber(values.fee_pct_rate);
	const feePerTicket = toOptionalNumber(values.fee_per_ticket);
	const feeFlat = toOptionalNumber(values.fee_flat);

	const hasAnyFeeOverride =
		feePctRate !== undefined ||
		feePerTicket !== undefined ||
		feeFlat !== undefined;

	return {
		organizerid: values.organizerid.trim(),
		name: values.name.trim(),
		first_name: values.first_name.trim(),
		last_name: values.last_name.trim(),
		email: values.email.trim(),
		status: values.status,
		vat_number: values.vat_number.trim(),
		tax_identification_number: values.tax_identification_number.trim(),
		tax_rate: Number.isNaN(taxRate) ? 0 : taxRate,
		iban: values.iban.trim(),
		bic: values.bic.trim(),
		billing_address: {
			street_address: values.billing_street_address.trim(),
			city: values.billing_city.trim(),
			zip_code: values.billing_zip_code.trim(),
			country: values.billing_country.trim(),
		},
		qonto_client_id: toOptional(values.qonto_client_id),
		qonto_beneficiary_id: toOptional(values.qonto_beneficiary_id),
		fee_override: hasAnyFeeOverride
			? {
					pct_rate: feePctRate ?? 0,
					per_ticket: Math.round(feePerTicket ?? 0),
					flat: Math.round(feeFlat ?? 0),
				}
			: undefined,
	};
};

export const formValuesToUpdateInput = (
	values: OrganizerFormValues,
): UpdateOrganizerInput => formValuesToCreateInput(values);

interface FormFieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	type?: React.ComponentProps<typeof Input>["type"];
}

const FormField = ({
	id,
	label,
	value,
	onChange,
	disabled,
	placeholder,
	type,
}: Readonly<FormFieldProps>) => (
	<Field>
		<FieldLabel htmlFor={id}>{label}</FieldLabel>
		<Input
			id={id}
			type={type}
			value={value}
			disabled={disabled}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
		/>
	</Field>
);

const SectionTitle = ({ title }: Readonly<{ title: string }>) => (
	<h3 className="text-sm">{title}</h3>
);

export function OrganizerForm({
	values,
	onChange,
	disabled = false,
	hideOrganizerId = false,
}: Readonly<OrganizerFormProps>) {
	const setField = <K extends keyof OrganizerFormValues>(
		key: K,
		value: OrganizerFormValues[K],
	) => {
		onChange({
			...values,
			[key]: value,
		});
	};

	const organizerIdInvalid =
		values.organizerid.trim().length > 0 &&
		!values.organizerid.trim().startsWith("org-");

	return (
		<div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
			{!hideOrganizerId && (
				<Field>
					<FieldLabel htmlFor="organizerid">Veranstalter ID</FieldLabel>
					<Input
						id="organizerid"
						value={values.organizerid}
						disabled={disabled}
						onChange={(event) => setField("organizerid", event.target.value)}
						placeholder="org-some-organizer"
					/>
					{organizerIdInvalid && (
						<p className="mt-1 text-red-600 text-xs">
							Veranstalter ID must start with "org-"
						</p>
					)}
				</Field>
			)}

			<div className="space-y-3">
				<SectionTitle title="Veranstalter" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="organizer-name"
						label="Name"
						value={values.name}
						disabled={disabled}
						onChange={(value) => setField("name", value)}
						placeholder="Muster Event GmbH"
					/>
					<FormField
						id="organizer-first-name"
						label="First name"
						value={values.first_name}
						disabled={disabled}
						onChange={(value) => setField("first_name", value)}
					/>
					<FormField
						id="organizer-last-name"
						label="Last name"
						value={values.last_name}
						disabled={disabled}
						onChange={(value) => setField("last_name", value)}
					/>
					<FormField
						id="organizer-email"
						label="Email"
						type="email"
						value={values.email}
						disabled={disabled}
						onChange={(value) => setField("email", value)}
					/>
					<Field>
						<FieldLabel htmlFor="organizer-status">Status</FieldLabel>
						<select
							id="organizer-status"
							value={values.status}
							disabled={disabled}
							onChange={(event) =>
								setField("status", event.target.value as OrganizerStatus)
							}
							className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
						>
							<option value="ACTIVE">ACTIVE</option>
							<option value="INACTIVE">INACTIVE</option>
						</select>
					</Field>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Tax and payout" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="organizer-vat-number"
						label="VAT number"
						value={values.vat_number}
						disabled={disabled}
						onChange={(value) => setField("vat_number", value)}
					/>
					<FormField
						id="organizer-tax-identification-number"
						label="Tax identification number"
						value={values.tax_identification_number}
						disabled={disabled}
						onChange={(value) => setField("tax_identification_number", value)}
					/>
					<FormField
						id="organizer-tax-rate"
						label="Tax rate (%)"
						type="number"
						value={values.tax_rate}
						disabled={disabled}
						onChange={(value) => setField("tax_rate", value)}
					/>
					<FormField
						id="organizer-iban"
						label="IBAN"
						value={values.iban}
						disabled={disabled}
						onChange={(value) => setField("iban", value)}
					/>
					<FormField
						id="organizer-bic"
						label="BIC"
						value={values.bic}
						disabled={disabled}
						onChange={(value) => setField("bic", value)}
					/>
					<FormField
						id="organizer-qonto-client-id"
						label="Qonto client ID"
						value={values.qonto_client_id}
						disabled={disabled}
						onChange={(value) => setField("qonto_client_id", value)}
					/>
					<FormField
						id="organizer-qonto-beneficiary-id"
						label="Qonto beneficiary ID"
						value={values.qonto_beneficiary_id}
						disabled={disabled}
						onChange={(value) => setField("qonto_beneficiary_id", value)}
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Billing address" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="organizer-billing-street"
						label="Street"
						value={values.billing_street_address}
						disabled={disabled}
						onChange={(value) => setField("billing_street_address", value)}
					/>
					<FormField
						id="organizer-billing-city"
						label="City"
						value={values.billing_city}
						disabled={disabled}
						onChange={(value) => setField("billing_city", value)}
					/>
					<FormField
						id="organizer-billing-zip"
						label="ZIP code"
						value={values.billing_zip_code}
						disabled={disabled}
						onChange={(value) => setField("billing_zip_code", value)}
					/>
					<FormField
						id="organizer-billing-country"
						label="Country"
						value={values.billing_country}
						disabled={disabled}
						onChange={(value) => setField("billing_country", value)}
						placeholder="DE"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Fee override (optional)" />
				<div className="grid gap-4 md:grid-cols-3">
					<FormField
						id="organizer-fee-pct-rate"
						label="Percent rate"
						type="number"
						value={values.fee_pct_rate}
						disabled={disabled}
						onChange={(value) => setField("fee_pct_rate", value)}
						placeholder="0.1"
					/>
					<FormField
						id="organizer-fee-per-ticket"
						label="Per ticket (cents)"
						type="number"
						value={values.fee_per_ticket}
						disabled={disabled}
						onChange={(value) => setField("fee_per_ticket", value)}
						placeholder="100"
					/>
					<FormField
						id="organizer-fee-flat"
						label="Flat fee (cents)"
						type="number"
						value={values.fee_flat}
						disabled={disabled}
						onChange={(value) => setField("fee_flat", value)}
						placeholder="5000"
					/>
				</div>
			</div>
		</div>
	);
}
