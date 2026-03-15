"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
	Client,
	CreateClientInput,
	UpdateClientInput,
} from "@/types/qonto/clients";

export type ClientKind = "individual" | "company" | "freelancer";

export interface ClientFormValues {
	kind: ClientKind;
	name: string;
	first_name: string;
	last_name: string;
	email: string;
	extra_emails: string;
	phone_country_code: string;
	phone_number: string;
	e_invoicing_address: string;
	vat_number: string;
	tax_identification_number: string;
	recipient_code: string;
	currency: string;
	locale: string;
	billing_street_address: string;
	billing_city: string;
	billing_zip_code: string;
	billing_province_code: string;
	billing_country_code: string;
	delivery_street_address: string;
	delivery_city: string;
	delivery_zip_code: string;
	delivery_province_code: string;
	delivery_country_code: string;
}

interface ClientFormProps {
	values: ClientFormValues;
	onChange: (values: ClientFormValues) => void;
	disabled?: boolean;
	hideKind?: boolean;
}

const toOptional = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeLocale = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	return trimmed.slice(0, 2).toLowerCase();
};

const asAddress = (
	street_address: string,
	city: string,
	zip_code: string,
	province_code: string,
	country_code: string,
) => {
	const address = {
		street_address: toOptional(street_address),
		city: toOptional(city),
		zip_code: toOptional(zip_code),
		province_code: toOptional(province_code),
		country_code: toOptional(country_code)?.toUpperCase(),
	};

	if (
		!address.street_address &&
		!address.city &&
		!address.zip_code &&
		!address.province_code &&
		!address.country_code
	) {
		return undefined;
	}

	return address;
};

export const defaultClientFormValues: ClientFormValues = {
	kind: "company",
	name: "",
	first_name: "",
	last_name: "",
	email: "",
	extra_emails: "",
	phone_country_code: "",
	phone_number: "",
	e_invoicing_address: "",
	vat_number: "",
	tax_identification_number: "",
	recipient_code: "",
	currency: "EUR",
	locale: "en",
	billing_street_address: "",
	billing_city: "",
	billing_zip_code: "",
	billing_province_code: "",
	billing_country_code: "",
	delivery_street_address: "",
	delivery_city: "",
	delivery_zip_code: "",
	delivery_province_code: "",
	delivery_country_code: "",
};

export const clientToFormValues = (client: Client): ClientFormValues => ({
	kind: client.kind,
	name: client.name ?? "",
	first_name: client.first_name ?? "",
	last_name: client.last_name ?? "",
	email: client.email ?? "",
	extra_emails: (client.extra_emails ?? []).join(", "),
	phone_country_code: client.phone?.country_code ?? "",
	phone_number: client.phone?.number ?? "",
	e_invoicing_address: client.e_invoicing_address ?? "",
	vat_number: client.vat_number ?? "",
	tax_identification_number: client.tax_identification_number ?? "",
	recipient_code: client.recipient_code ?? "",
	currency: client.currency ?? "EUR",
	locale: client.locale ?? "en",
	billing_street_address: client.billing_address?.street_address ?? "",
	billing_city: client.billing_address?.city ?? "",
	billing_zip_code: client.billing_address?.zip_code ?? "",
	billing_province_code: client.billing_address?.province_code ?? "",
	billing_country_code: client.billing_address?.country_code ?? "",
	delivery_street_address: client.delivery_address?.street_address ?? "",
	delivery_city: client.delivery_address?.city ?? "",
	delivery_zip_code: client.delivery_address?.zip_code ?? "",
	delivery_province_code: client.delivery_address?.province_code ?? "",
	delivery_country_code: client.delivery_address?.country_code ?? "",
});

export const formValuesToCreateInput = (
	values: ClientFormValues,
): CreateClientInput => {
	const extraEmails = values.extra_emails
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);

	const billingAddress = asAddress(
		values.billing_street_address,
		values.billing_city,
		values.billing_zip_code,
		values.billing_province_code,
		values.billing_country_code,
	);

	const deliveryAddress = asAddress(
		values.delivery_street_address,
		values.delivery_city,
		values.delivery_zip_code,
		values.delivery_province_code,
		values.delivery_country_code,
	);

	return {
		kind: values.kind,
		name: toOptional(values.name),
		first_name: toOptional(values.first_name),
		last_name: toOptional(values.last_name),
		email: toOptional(values.email),
		extra_emails: extraEmails.length > 0 ? extraEmails : undefined,
		phone:
			values.phone_country_code.trim() && values.phone_number.trim()
				? {
						country_code: values.phone_country_code.trim(),
						number: values.phone_number.trim(),
					}
				: undefined,
		e_invoicing_address: toOptional(values.e_invoicing_address),
		vat_number: toOptional(values.vat_number),
		tax_identification_number: toOptional(values.tax_identification_number),
		recipient_code: toOptional(values.recipient_code),
		currency: toOptional(values.currency)?.toUpperCase(),
		locale: normalizeLocale(values.locale),
		billing_address: billingAddress,
		delivery_address: deliveryAddress,
	};
};

export const formValuesToUpdateInput = (
	values: ClientFormValues,
): UpdateClientInput => {
	const { kind: _kind, ...createInput } = formValuesToCreateInput(values);
	return createInput;
};

const SectionTitle = ({ title }: Readonly<{ title: string }>) => (
	<h3 className="text-sm">{title}</h3>
);

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

export function ClientForm({
	values,
	onChange,
	disabled = false,
	hideKind = false,
}: Readonly<ClientFormProps>) {
	const setField = <K extends keyof ClientFormValues>(
		key: K,
		value: string,
	) => {
		onChange({
			...values,
			[key]: value,
		});
	};

	return (
		<div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
			{!hideKind && (
				<Field>
					<FieldLabel htmlFor="client-kind">Client type</FieldLabel>
					<select
						id="client-kind"
						value={values.kind}
						disabled={disabled}
						onChange={(event) =>
							setField("kind", event.target.value as ClientKind)
						}
						className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
					>
						<option value="company">Company</option>
						<option value="individual">Individual</option>
						<option value="freelancer">Freelancer</option>
					</select>
				</Field>
			)}

			<div className="space-y-3">
				<SectionTitle title="Core identity" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="client-name"
						label="Company name"
						value={values.name}
						disabled={disabled}
						onChange={(value) => setField("name", value)}
						placeholder="Acme GmbH"
					/>
					<FormField
						id="client-first-name"
						label="First name"
						value={values.first_name}
						disabled={disabled}
						onChange={(value) => setField("first_name", value)}
						placeholder="Jane"
					/>
					<FormField
						id="client-last-name"
						label="Last name"
						value={values.last_name}
						disabled={disabled}
						onChange={(value) => setField("last_name", value)}
						placeholder="Doe"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Contact" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="client-email"
						label="Email"
						type="email"
						value={values.email}
						disabled={disabled}
						onChange={(value) => setField("email", value)}
						placeholder="billing@acme.com"
					/>
					<FormField
						id="client-extra-emails"
						label="Extra emails"
						value={values.extra_emails}
						disabled={disabled}
						onChange={(value) => setField("extra_emails", value)}
						placeholder="ops@acme.com, accounting@acme.com"
					/>
					<FormField
						id="client-phone-country"
						label="Phone country code"
						value={values.phone_country_code}
						disabled={disabled}
						onChange={(value) => setField("phone_country_code", value)}
						placeholder="+49"
					/>
					<FormField
						id="client-phone-number"
						label="Phone number"
						value={values.phone_number}
						disabled={disabled}
						onChange={(value) => setField("phone_number", value)}
						placeholder="1512345678"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Tax and legal" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="client-vat-number"
						label="VAT number"
						value={values.vat_number}
						disabled={disabled}
						onChange={(value) => setField("vat_number", value)}
						placeholder="DE123456789"
					/>
					<FormField
						id="client-tax-id"
						label="Tax identification number"
						value={values.tax_identification_number}
						disabled={disabled}
						onChange={(value) => setField("tax_identification_number", value)}
						placeholder="123456789"
					/>
					<FormField
						id="client-e-invoicing"
						label="E-invoicing address"
						value={values.e_invoicing_address}
						disabled={disabled}
						onChange={(value) => setField("e_invoicing_address", value)}
						placeholder="987654321"
					/>
					<FormField
						id="client-recipient-code"
						label="Recipient code"
						value={values.recipient_code}
						disabled={disabled}
						onChange={(value) => setField("recipient_code", value)}
						placeholder="ABCDE12"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Invoicing preferences" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="client-currency"
						label="Currency"
						value={values.currency}
						disabled={disabled}
						onChange={(value) => setField("currency", value)}
						placeholder="EUR"
					/>
					<FormField
						id="client-locale"
						label="Locale"
						value={values.locale}
						disabled={disabled}
						onChange={(value) => setField("locale", value)}
						placeholder="en"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Billing address" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="client-billing-street"
						label="Street address"
						value={values.billing_street_address}
						disabled={disabled}
						onChange={(value) => setField("billing_street_address", value)}
					/>
					<FormField
						id="client-billing-city"
						label="City"
						value={values.billing_city}
						disabled={disabled}
						onChange={(value) => setField("billing_city", value)}
					/>
					<FormField
						id="client-billing-zip"
						label="Zip code"
						value={values.billing_zip_code}
						disabled={disabled}
						onChange={(value) => setField("billing_zip_code", value)}
					/>
					<FormField
						id="client-billing-province"
						label="Province code"
						value={values.billing_province_code}
						disabled={disabled}
						onChange={(value) => setField("billing_province_code", value)}
					/>
					<FormField
						id="client-billing-country"
						label="Country code"
						value={values.billing_country_code}
						disabled={disabled}
						onChange={(value) => setField("billing_country_code", value)}
						placeholder="DE"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<SectionTitle title="Delivery address" />
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						id="client-delivery-street"
						label="Street address"
						value={values.delivery_street_address}
						disabled={disabled}
						onChange={(value) => setField("delivery_street_address", value)}
					/>
					<FormField
						id="client-delivery-city"
						label="City"
						value={values.delivery_city}
						disabled={disabled}
						onChange={(value) => setField("delivery_city", value)}
					/>
					<FormField
						id="client-delivery-zip"
						label="Zip code"
						value={values.delivery_zip_code}
						disabled={disabled}
						onChange={(value) => setField("delivery_zip_code", value)}
					/>
					<FormField
						id="client-delivery-province"
						label="Province code"
						value={values.delivery_province_code}
						disabled={disabled}
						onChange={(value) => setField("delivery_province_code", value)}
					/>
					<FormField
						id="client-delivery-country"
						label="Country code"
						value={values.delivery_country_code}
						disabled={disabled}
						onChange={(value) => setField("delivery_country_code", value)}
						placeholder="DE"
					/>
				</div>
			</div>
		</div>
	);
}
