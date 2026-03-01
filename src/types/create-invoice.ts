import { z } from "zod";
import { ClientInvoiceSchema, MoneySchema } from "./invoice";

const ItemDiscountSchema = z.object({
    type: z.enum(["percentage"]),
    value: z.string(),
});

const ItemSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    quantity: z.string(),
    unit: z.string().optional(),
    unit_price: MoneySchema,
    vat_rate: z.string(),
    vat_exemption_reason: z.string().optional(),
    discount: ItemDiscountSchema.optional(),
});

const SettingsSchema = z.object({
    vat_number: z.string().optional(),
    company_leadership: z.string().optional(),
    district_court: z.string().optional(),
    commercial_register_number: z.string().optional(),
    tax_number: z.string().optional(),
    legal_capital_share: MoneySchema.optional(),
    transaction_type: z.enum(["goods"]).optional(),
    vat_payment_condition: z.enum(["on_receipts"]).optional(),
    discount_conditions: z.string().optional(),
    late_payment_penalties: z.string().optional(),
    legal_fixed_compensation: z.string().optional(),
});

const PaymentMethodsSchema = z.object({
    iban: z.string(),
});

const PaymentReportingSchema = z.object({
    conditions: z.string(),
    method: z.string(),
});

const WelfareFundSchema = z.object({
    type: z.string(),
    rate: z.string(),
});

const WithholdingTaxSchema = z.object({
    reason: z.string(),
    rate: z.string(),
    payment_reason: z.string().optional(),
});

const InvoiceDiscountSchema = z.object({
    type: z.enum(["percentage"]),
    value: z.string(),
});

export const QontoCreateClientInvoiceSchema = z.object({
    client_id: z.uuid(),
    upload_id: z.uuid().optional(),
    issue_date: z.iso.date(), // YYYY-MM-DD
    performance_date: z.string().optional(),
    performance_start_date: z.string().optional(),
    performance_end_date: z.string().optional(),
    due_date: z.iso.date(), // YYYY-MM-DD
    status: z.enum(["draft"]).optional(),
    number: z.string().optional(),
    purchase_order: z.string().optional(),
    terms_and_conditions: z.string().optional(),
    header: z.string().optional(),
    footer: z.string().optional(),
    currency: z.string().optional(),
    payment_methods: PaymentMethodsSchema.optional(),
    settings: SettingsSchema.optional(),
    items: z.array(ItemSchema).min(1),
    report_einvoicing: z.boolean().optional(),
    payment_reporting: PaymentReportingSchema.optional(),
    welfare_fund: WelfareFundSchema.optional(),
    withholding_tax: WithholdingTaxSchema.optional(),
    stamp_duty_amount: z.string().optional(),
    discount: InvoiceDiscountSchema.optional(),
});

export const CreateClientInvoiceResponseSchema = z.object({
    client_invoice: ClientInvoiceSchema,
});
