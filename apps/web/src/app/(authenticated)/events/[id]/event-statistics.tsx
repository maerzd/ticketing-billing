import type { RevenueResponse } from "@ticketing-billing/types/vivenu/revenue";
import type { TicketSales } from "@ticketing-billing/types/vivenu/ticket-sales";
import { ChartBarStacked } from "@/components/charts/chart-bar-stacked";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { formatCurrency, formatNumber } from "@/lib/utils";

function SectionCard({
	value,
	unit = "",
	description,
}: {
	value: number | string;
	description: string;
	unit?: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardDescription>{description}</CardDescription>
				<CardTitle className="font-semibold text-3xl tabular-nums">
					{value}{" "}
					<span className="font-normal text-base text-slate-600">{unit}</span>
				</CardTitle>
			</CardHeader>
		</Card>
	);
}
function TicketBarChart({ ticketSales }: { ticketSales: TicketSales | null }) {
	if (!ticketSales) {
		return null;
	}
	const chartConfig = {
		category: {
			label: "Kategorie",
			color: "var(--chart-1)",
		},
		count: {
			label: "Anzahl",
			color: "var(--chart-2)",
		},
		posCount: {
			label: "Anzahl POS",
			color: "var(--chart-2)",
		},
		webCount: {
			label: "Anzahl WEB",
			color: "var(--chart-2)",
		},
	} satisfies ChartConfig;
	const chartData = ticketSales.results.map((item) => ({
		category: ticketSales.meta.categoryRef[item.categoryRef].label,
		count: item.count,
		posCount: item.countPos ?? 0,
		webCount: item.countOnline ?? 0,
	}));
	return (
		chartData && (
			<ChartBarStacked
				title="Tickets"
				description="nach Kategorie"
				chartConfig={chartConfig}
				chartData={chartData}
				dataKey="category"
				dataName="count"
			/>
		)
	);
}
export function EventStatistics({
	revenue,
	ticketSales,
}: {
	revenue: RevenueResponse | null;
	ticketSales: TicketSales | null;
}) {
	const ticketsCount =
		ticketSales?.results.reduce((sum, result) => sum + result.count, 0) ?? 0;

	const totalRevenue =
		revenue?.results.reduce(
			(sum, result) =>
				sum + (result.itemType === "ticket" ? (result.net_revenue ?? 0) : 0),
			0,
		) ?? 0;
	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1">
				<TicketBarChart ticketSales={ticketSales} />
				{/* <TicketCountChart ticketSales={ticketSales} /> */}
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				<SectionCard
					value={formatNumber(ticketsCount, 0)}
					unit="Tickets"
					description="Auslastung"
				/>
				<SectionCard
					value={formatCurrency(totalRevenue)}
					description="Umsatz"
					// footerTitle={`${onlineRevenue?.toFixed(2)} ${currency} online / ${posRevenue?.toFixed(2)} ${currency} POS`}
				/>
			</div>
		</div>
	);
}
