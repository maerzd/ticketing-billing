"use client";
import type { VivenuEvent } from "@ticketing-billing/types";
import type { OrganizerRecord } from "@ticketing-billing/types/ddb";
import type { PosDevice } from "@ticketing-billing/types/vivenu/pos";
import type { RevenueResponse } from "@ticketing-billing/types/vivenu/revenue";
import type { TicketSales } from "@ticketing-billing/types/vivenu/ticket-sales";
import React, { useId } from "react";
import LabelText from "@/components/my-ui/label-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ZUENFTICK_SHOP_IDS } from "@/lib/constants";
import type { OrganizerData } from "@/lib/notion/notion-types";
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
}: {
	event: VivenuEvent;
	ticketAnalytics: TicketSales | null;
	revenue: RevenueResponse | null;
	pos: PosDevice[] | null;
	organizer: OrganizerRecord | null;
}) {
	const revenuePerPos = calculateRevenuePerPosId(revenue);
	const [setupFee, setSetupFee] = React.useState(25);
	const [eventTaxValue, setEventTaxValue] = React.useState(
		organizer?.taxRate || 0,
	);
	const [officialPos, setOfficialPos] = React.useState<Set<string>>(
		new Set(ZUENFTICK_SHOP_IDS),
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
			<h3 className="font-semibold">Einstellungen</h3>
			<div className="grid grid-cols-2 grid-rows-2 gap-4">
				<LabelText
					label="Steuersatz der Veranstaltung"
					value={
						<TaxSelector
							eventTaxValue={eventTaxValue}
							setEventTaxValue={setEventTaxValue}
						/>
					}
				/>
				<LabelText
					label="POS Umsatz (für Auszahlung auswählen)"
					value={
						<PosSelector
							revenuePerPos={revenuePerPos}
							pos={pos}
							selectedPos={officialPos}
							setSelectedPos={setOfficialPos}
						/>
					}
					className="row-span-2"
				/>
				<LabelText
					label="Einrichtungsgebühr"
					value={
						<SetupFeeSelector setupFee={setupFee} setSetupFee={setSetupFee} />
					}
				/>
			</div>

			<Invoice
				event={event}
				totalRevenue={totalRevenue}
				ticketsCount={ticketsCount}
				officialPos={officialPos}
				revenuePerPos={revenuePerPos}
				eventTaxRate={eventTaxValue}
				setupFee={setupFee}
				organizer={organizer}
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
		<div className="flex flex-col gap-2">
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
