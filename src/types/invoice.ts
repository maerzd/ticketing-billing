import { z } from "zod";
import { QontoMetaSchema } from "./shared";

const MoneySchema = z.object({
	value: z.string().optional(),
	currency: z.string().optional(),
});

const AddressSchema = z.object({
	street_address: z.string().max(250).optional(),
	city: z.string().max(50).optional(),
	zip_code: z.string().max(20).optional(),
	province_code: z.string().max(2).optional(),
	country_code: z.string().max(2).optional(),
});

const DiscountSchema = z.object({
	type: z.enum(["percentage", "absolute"]).optional(),
	value: z.string().optional(),
	amount: MoneySchema.optional(),
});

const ItemSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	quantity: z.string().optional(),
	unit: z.string().optional(),
	unit_price: MoneySchema.optional(),
	unit_price_cents: z.number().int().optional(),
	vat_rate: z.string().optional(),
	vat_exemption_reason: z
		.enum([
			"N1",
			"N2",
			"N2.1",
			"N2.2",
			"N3",
			"N3.1",
			"N3.2",
			"N3.3",
			"N3.4",
			"N3.5",
			"N3.6",
			"N4",
			"N5",
			"N6",
			"N6.1",
			"N6.2",
			"N6.3",
			"N6.4",
			"N6.5",
			"N6.6",
			"N6.7",
			"N6.8",
			"N6.9",
			"N7",
			"S293B",
			"S262.1",
			"S259",
			"S283",
			"S261",
			"S262",
			"S263",
			"S19.1",
			"S4.1B",
			"S4.1A",
			"S4",
			"S13B",
			"S122",
			"S25",
			"S21",
			"S69",
			"S20",
			"S84.1.2",
		])
		.optional(),
	discount: DiscountSchema.optional(),
	total_vat: MoneySchema.optional(),
	total_vat_cents: z.number().int().optional(),
	total_amount: MoneySchema.optional(),
	total_amount_cents: z.number().int().optional(),
	subtotal: MoneySchema.optional(),
	subtotal_cents: z.number().int().optional(),
});

const ClientSchema = z.object({
	id: z.uuid().optional(),
	name: z.string().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	type: z.enum(["individual", "company", "freelancer"]).optional(),
	email: z.email().optional().or(z.literal("")),
	vat_number: z.string().optional(),
	tax_identification_number: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	zip_code: z.string().optional(),
	province_code: z.string().optional(),
	country_code: z.string().optional(),
	recipient_code: z.string().optional(),
	locale: z.string().optional(),
	billing_address: AddressSchema.optional(),
	delivery_address: AddressSchema.optional(),
});

const PaymentMethodSchema = z.object({
	beneficiary_name: z.string().optional(),
	bic: z.string().optional(),
	iban: z.string().optional(),
	type: z.enum(["transfer"]).optional(),
});

const OrganizationSchema = z.object({
	id: z.uuid().optional(),
	legal_name: z.string().optional(),
	legal_number: z.string().optional(),
	legal_country: z.string().optional(),
	address_line_1: z.string().optional(),
	address_line_2: z.string().optional(),
	address_zipcode: z.string().optional(),
	address_city: z.string().optional(),
	address_country: z.string().optional(),
	company_leadership: z.string().optional(),
	district_court: z.string().optional(),
	commercial_register_number: z.string().optional(),
	vat_number: z.string().optional(),
	tax_number: z.string().optional(),
	legal_capital_share: z
		.object({
			value: z.string().max(12).optional(),
			currency: z
				.enum([
					"AED",
					"AUD",
					"BGN",
					"CAD",
					"CHF",
					"CNY",
					"CZK",
					"DKK",
					"EUR",
					"GBP",
					"GHS",
					"HKD",
					"HUF",
					"ILS",
					"MXN",
					"NOK",
					"NZD",
					"PEN",
					"PLN",
					"RON",
					"RSD",
					"SAR",
					"SEK",
					"SGD",
					"TRY",
					"USD",
					"ZAR",
					"ZMW",
				])
				.default("EUR")
				.optional(),
		})
		.nullable()
		.optional(),
	transaction_type: z
		.enum(["goods", "services", "goods_and_services", ""])
		.optional(),
	vat_payment_condition: z
		.enum(["on_receipts", "compensated_for_sales", "exempt", ""])
		.optional(),
});

const EinvoicingLifecycleEventSchema = z.object({
	status_code: z
		.enum([
			"200",
			"201",
			"202",
			"203",
			"204",
			"205",
			"206",
			"207",
			"208",
			"209",
			"210",
			"211",
			"212",
			"213",
			"214",
		])
		.optional(),
	reason: z.string().optional(),
	reason_message: z.string().optional(),
	timestamp: z.iso.datetime().optional(),
});

export const ClientInvoiceSchema = z.object({
	id: z.uuid(),
	organization_id: z.uuid(),
	number: z.string(),
	purchase_order: z.string(),
	status: z.enum(["draft", "unpaid", "paid", "canceled"]),
	invoice_url: z.url(),
	contact_email: z.email(),
	terms_and_conditions: z.string(),
	discount_conditions: z.string().nullable(),
	late_payment_penalties: z.string().nullable(),
	legal_fixed_compensation: z.string().nullable(),
	header: z.string(),
	footer: z.string(),
	currency: z.string(),
	total_amount: MoneySchema,
	total_amount_cents: z.number().int(),
	vat_amount: MoneySchema,
	vat_amount_cents: z.number().int(),
	issue_date: z.iso.date(),
	due_date: z.iso.date(),
	performance_date: z.string().optional(), // deprecated
	performance_start_date: z.iso.date().or(z.literal("")),
	performance_end_date: z.iso.date().or(z.literal("")),
	created_at: z.iso.datetime({ offset: true }),
	finalized_at: z.iso.datetime({ offset: true }),
	paid_at: z.iso.datetime({ offset: true }).or(z.literal("")),
	stamp_duty_amount: z.string().min(4).max(15),
	items: z.array(ItemSchema),
	client: ClientSchema,
	payment_methods: z.array(PaymentMethodSchema),
	credit_notes_ids: z.array(z.uuid()),
	organization: OrganizationSchema,
	invoice_type: z.enum(["standard", "deposit", "balance"]),
	attachment_id: z.uuid().optional(),
	discount: DiscountSchema.optional(),
	einvoicing_status: z
		.enum([
			"pending",
			"submitted",
			"declined",
			"approved",
			"not_delivered",
			"submission_failed",
		])
		.optional(),
	welfare_fund: z
		.object({
			type: z
				.enum([
					"TC01",
					"TC02",
					"TC03",
					"TC04",
					"TC05",
					"TC06",
					"TC07",
					"TC08",
					"TC09",
					"TC10",
					"TC11",
					"TC12",
					"TC13",
					"TC14",
					"TC15",
					"TC16",
					"TC17",
					"TC18",
					"TC19",
					"TC20",
					"TC21",
					"TC22",
				])
				.optional(),
			rate: z.string().min(4).max(6).optional(),
		})
		.optional(),
	withholding_tax: z
		.object({
			reason: z
				.enum(["RF01", "RF02", "RF03", "RF04", "RF05", "RF06"])
				.optional(),
			rate: z.string().min(4).max(6).optional(),
			payment_reason: z.string().min(1).max(2).optional(),
			amount: z.string().optional(),
		})
		.optional(),
	payment_reporting: z
		.object({
			conditions: z.enum(["TP01", "TP02", "TP03"]).optional(),
			method: z
				.enum([
					"MP01",
					"MP02",
					"MP03",
					"MP04",
					"MP05",
					"MP06",
					"MP07",
					"MP08",
					"MP09",
					"MP10",
					"MP11",
					"MP12",
					"MP13",
					"MP14",
					"MP15",
					"MP16",
					"MP17",
					"MP18",
					"MP19",
					"MP20",
					"MP21",
					"MP22",
				])
				.optional(),
		})
		.optional(),
	einvoicing_lifecycle_events: z
		.array(EinvoicingLifecycleEventSchema)
		.optional(),
});

export const ListClientInvoicesSchema = z.object({
	client_invoices: z.array(ClientInvoiceSchema),
	meta: QontoMetaSchema,
});

export type QontoListClientInvoices = z.infer<typeof ListClientInvoicesSchema>;
