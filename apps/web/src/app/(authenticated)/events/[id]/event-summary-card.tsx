import type { VivenuEvent } from "@ticketing-billing/types";
import type { RevenueResponse } from "@ticketing-billing/types/vivenu/revenue";
import type { TicketSales } from "@ticketing-billing/types/vivenu/ticket-sales";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

function KpiCard({ value, label }: { value: string; label: string }) {
	return (
		<Card>
			<CardHeader className="p-4">
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
			</CardHeader>
		</Card>
	);
}

export function EventSummaryCard({
	event,
	ticketSales,
	revenue,
}: {
	event: VivenuEvent;
	ticketSales: TicketSales | null;
	revenue: RevenueResponse | null;
}) {
	const ticketsCount =
		ticketSales?.results.reduce((sum, r) => sum + r.count, 0) ?? 0;
	const totalRevenue =
		revenue?.results.reduce(
			(sum, r) => sum + (r.itemType === "ticket" ? (r.net_revenue ?? 0) : 0),
			0,
		) ?? 0;

	const startDate = new Date(event.start).toLocaleDateString("de-DE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	return (
		<div className="grid grid-cols-3 gap-3">
			<KpiCard label="Datum" value={startDate} />
			<KpiCard label="Tickets" value={formatNumber(ticketsCount)} />
			<KpiCard label="Umsatz" value={formatCurrency(totalRevenue)} />
		</div>
	);
}
