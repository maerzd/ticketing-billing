import { SALES_TAX_RATE } from "@/lib/constants";

export interface BillingCalculatorInput {
	totalRevenue: number;
	ticketsCount: number;
	revenuePerPos: Record<string, number>;
	officialPos: Set<string>;
	eventTaxRate: number;
	/** Setup fee in euros */
	setupFee: number;
	ticketCommissionRate: number;
}

export interface BillingAmounts {
	// Euros (for display)
	systemFee: number;
	systemFeeWithTax: number;
	variableFee: number;
	variableFeeWithTax: number;
	setupFeeWithTax: number;
	netInvoiceAmount: number;
	invoiceAmount: number;
	revenueOrganizer: number;
	payoutAmount: number;

	// Cents (for storage)
	totalRevenueCents: number;
	invoiceAmountCents: number;
	invoiceNetCents: number;
	payoutAmountCents: number;
	revenueOrganizerCents: number;
}

/**
 * Pure function that computes all billing amounts from event + settings data.
 * Shared between the UI preview and server actions.
 */
export function calculateBillingAmounts(
	input: BillingCalculatorInput,
): BillingAmounts {
	const {
		totalRevenue,
		ticketsCount,
		revenuePerPos,
		officialPos,
		eventTaxRate,
		setupFee,
		ticketCommissionRate,
	} = input;

	// Systemgebühr: 1€ pro verkauftem Ticket
	const systemFee = ticketsCount * 1;
	const systemFeeWithTax = systemFee * (1 + SALES_TAX_RATE);

	// Variable Vorverkaufsgebühr
	const variableFeeHelper =
		(totalRevenue - systemFeeWithTax) /
		(1 + ticketCommissionRate * (1 + Number(eventTaxRate)));
	const variableFeeWithTax =
		totalRevenue - systemFeeWithTax - variableFeeHelper;
	const variableFee = variableFeeWithTax / (1 + Number(eventTaxRate));

	// Einrichtungsgebühr
	const setupFeeWithTax = setupFee * (1 + SALES_TAX_RATE);

	// Invoice totals
	const invoiceAmount = systemFeeWithTax + variableFeeWithTax + setupFeeWithTax;
	const netInvoiceAmount = systemFee + variableFee + setupFee;

	// Organizer's own POS revenue (not collected by us)
	const revenueOrganizer = Object.entries(revenuePerPos).reduce(
		(sum, [posId, revenue]) =>
			officialPos.has(posId) || posId === "Online" ? sum : sum + revenue,
		0,
	);

	const payoutAmount = totalRevenue - invoiceAmount - revenueOrganizer;

	const round = (v: number) => Math.round(v * 100);

	return {
		systemFee,
		systemFeeWithTax,
		variableFee,
		variableFeeWithTax,
		setupFeeWithTax,
		netInvoiceAmount,
		invoiceAmount,
		revenueOrganizer,
		payoutAmount,
		// Cents
		totalRevenueCents: round(totalRevenue),
		invoiceAmountCents: round(invoiceAmount),
		invoiceNetCents: round(netInvoiceAmount),
		payoutAmountCents: round(payoutAmount),
		revenueOrganizerCents: round(revenueOrganizer),
	};
}
