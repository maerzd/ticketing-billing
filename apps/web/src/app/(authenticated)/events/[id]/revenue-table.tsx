"use client";
import type { BankAccount } from "@qonto/embed-sdk/types";
import type { VivenuEvent } from "@ticketing-billing/types";
import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import type { PosDevice } from "@ticketing-billing/types/vivenu/pos";
import type { RevenueResponse } from "@ticketing-billing/types/vivenu/revenue";
import type { TicketSales } from "@ticketing-billing/types/vivenu/ticket-sales";
import React, { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TICKET_COMMISSION_RATE, ZUENFTICK_SHOP_IDS } from "@/lib/constants";
import Invoice from "./invoice";

interface PosRevenueMapping {
	[posId: string]: number;
}

const calculateRevenuePerPosId = (
	revenue: RevenueResponse | null,
): PosRevenueMapping => {
	if (!revenue) return {};

	const revenueByPos: PosRevenueMapping = {};

	for (const item of revenue.results) {
		if (item.itemType === "ticket") {
			const posKey = item.posId || "Online";
			revenueByPos[posKey] =
				(revenueByPos[posKey] ?? 0) + (item.net_revenue ?? 0);
		}
	}

	return revenueByPos;
};

export default function RevenueTable({
	event,
	ticketAnalytics,
	revenue,
	pos,
	organizer,
	billingRecord,
	bankAccounts,
}: {
	event: VivenuEvent;
	ticketAnalytics: TicketSales | null;
	revenue: RevenueResponse | null;
	pos: PosDevice[] | null;
	organizer: OrganizerRecord | null;
	billingRecord?: BillingRecord;
	bankAccounts?: BankAccount[];
}) {
	const revenuePerPos = calculateRevenuePerPosId(revenue);

	// Initialize settings from billing record snapshot if available, else fallback to organizer defaults
	const isLocked = billingRecord && billingRecord.invoiceStatus !== "DRAFT";

	const [setupFee, setSetupFee] = React.useState(
		billingRecord
			? billingRecord.setupFee / 100
			: (organizer?.defaultSetupFee ?? 2500) / 100,
	);
	const [eventTaxValue, setEventTaxValue] = React.useState(
		billingRecord
			? billingRecord.eventTaxRate
			: (organizer?.defaultEventTaxRate ?? organizer?.taxRate ?? 0),
	);
	const [ticketCommissionRate] = React.useState(
		billingRecord
			? billingRecord.ticketCommissionRate
			: (organizer?.defaultTicketCommissionRate ?? TICKET_COMMISSION_RATE),
	);
	const [officialPos, setOfficialPos] = React.useState<Set<string>>(
		billingRecord
			? new Set(billingRecord.officialPos)
			: new Set(ZUENFTICK_SHOP_IDS),
	);

	const ticketsCount =
		ticketAnalytics?.results.reduce((sum, result) => sum + result.count, 0) ??
		0;

	const totalRevenue =
		ticketAnalytics?.results.reduce(
			(sum, ticket) => sum + (ticket.count ?? 0) * (ticket.price ?? 0),
			0,
		) ?? 0;

	return (
		<div>
			{!isLocked && (
				<div className="mb-4 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
					<div className="flex flex-wrap gap-x-8 gap-y-4">
						<div>
							<p className="mb-2 text-muted-foreground text-xs">
								Steuersatz Veranstaltung
							</p>
							<TaxSelector
								eventTaxValue={eventTaxValue}
								setEventTaxValue={setEventTaxValue}
							/>
						</div>
						<div>
							<p className="mb-2 text-muted-foreground text-xs">
								Einrichtungsgebühr
							</p>
							<SetupFeeSelector setupFee={setupFee} setSetupFee={setSetupFee} />
						</div>
						<div>
							<p className="mb-2 text-muted-foreground text-xs">
								POS Umsatz (für Auszahlung)
							</p>
							<PosSelector
								revenuePerPos={revenuePerPos}
								pos={pos}
								selectedPos={officialPos}
								setSelectedPos={setOfficialPos}
							/>
						</div>
					</div>
				</div>
			)}

			<Invoice
				event={event}
				totalRevenue={totalRevenue}
				ticketsCount={ticketsCount}
				officialPos={officialPos}
				revenuePerPos={revenuePerPos}
				eventTaxRate={eventTaxValue}
				setupFee={setupFee}
				ticketCommissionRate={ticketCommissionRate}
				organizer={organizer}
				billingRecord={billingRecord}
				bankAccounts={bankAccounts}
			/>
		</div>
	);
}

function TaxSelector({
	eventTaxValue,
	setEventTaxValue,
}: {
	eventTaxValue: number;
	setEventTaxValue: (value: number) => void;
}) {
	const id = useId();
	return (
		<RadioGroup
			value={eventTaxValue?.toString()}
			onValueChange={(value) => setEventTaxValue(Number(value))}
			className="flex space-x-4"
		>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="0" id={`${id}-option-0`} />
				<Label htmlFor={`${id}-option-0`}>0%</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="0.07" id={`${id}-option-07`} />
				<Label htmlFor={`${id}-option-07`}>7%</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="0.19" id={`${id}-option-19`} />
				<Label htmlFor={`${id}-option-19`}>19%</Label>
			</div>
		</RadioGroup>
	);
}
function SetupFeeSelector({
	setupFee,
	setSetupFee,
}: {
	setupFee: number;
	setSetupFee: (value: number) => void;
}) {
	const id = useId();
	return (
		<RadioGroup
			value={setupFee?.toString()}
			onValueChange={(value) => setSetupFee(Number(value))}
			className="flex space-x-4"
		>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="25" id={`${id}-option-0`} />
				<Label htmlFor={`${id}-option-0`}>25€</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="50" id={`${id}-option-07`} />
				<Label htmlFor={`${id}-option-07`}>50€</Label>
			</div>
		</RadioGroup>
	);
}

function PosSelector({
	revenuePerPos,
	pos,
	selectedPos,
	setSelectedPos,
}: {
	revenuePerPos: PosRevenueMapping;
	pos: PosDevice[] | null;
	selectedPos: Set<string>;
	setSelectedPos: (pos: Set<string>) => void;
}) {
	const handleSelectPos = (id: string, checked: boolean) => {
		const newSelected = new Set(selectedPos);
		if (checked) {
			newSelected.add(id);
		} else {
			newSelected.delete(id);
		}
		setSelectedPos(newSelected);
	};
	return (
		<div className="flex flex-wrap gap-x-4 gap-y-2">
			{Object.entries(revenuePerPos)
				.sort(([, a], [, b]) => b - a)
				.map(([posId]) => (
					<div
						key={posId}
						data-state={selectedPos.has(posId) ? "selected" : undefined}
						className="flex flex-row gap-2"
					>
						<Checkbox
							id={`pos-${posId}-checkbox`}
							name={`pos-${posId}-checkbox`}
							checked={selectedPos.has(posId)}
							onCheckedChange={(checked) =>
								handleSelectPos(posId, checked === true)
							}
						/>
						<Label htmlFor={`pos-${posId}-checkbox`}>
							{pos?.find((p) => p._id === posId)?.name ?? posId}
						</Label>
					</div>
				))}
		</div>
	);
}
