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
	// Euros
	systemFeeNet: number;
	systemFeeWithTax: number;
	variableFeeNet: number;
	variableFeeWithTax: number;
	setupFeeNet: number;
	setupFeeWithTax: number;
	netInvoiceAmount: number;
	invoiceAmount: number;
	revenueOrganizer: number;
	payoutAmount: number;
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
	const systemFeeNet = ticketsCount * 1;
	const systemFeeWithTax = systemFeeNet * (1 + SALES_TAX_RATE);

	// Variable Vorverkaufsgebühr
	const variableFeeHelper =
		(totalRevenue - systemFeeWithTax) /
		(1 + ticketCommissionRate * (1 + Number(eventTaxRate)));
	const variableFeeWithTax =
		totalRevenue - systemFeeWithTax - variableFeeHelper;
	const variableFeeNet = variableFeeWithTax / (1 + Number(eventTaxRate));

	// Einrichtungsgebühr
	const setupFeeNet = setupFee;
	const setupFeeWithTax = setupFeeNet * (1 + SALES_TAX_RATE);

	// Invoice totals
	const invoiceAmount = systemFeeWithTax + variableFeeWithTax + setupFeeWithTax;
	const netInvoiceAmount = systemFeeNet + variableFeeNet + setupFeeNet;

	// Organizer's own POS revenue (not collected by us)
	const revenueOrganizer = Object.entries(revenuePerPos).reduce(
		(sum, [posId, revenue]) =>
			officialPos.has(posId) || posId === "Online" ? sum : sum + revenue,
		0,
	);

	const payoutAmount = totalRevenue - invoiceAmount - revenueOrganizer;

	return {
		systemFeeNet,
		systemFeeWithTax,
		variableFeeNet,
		variableFeeWithTax,
		setupFeeNet,
		setupFeeWithTax,
		netInvoiceAmount,
		invoiceAmount,
		revenueOrganizer,
		payoutAmount,
	};
}
