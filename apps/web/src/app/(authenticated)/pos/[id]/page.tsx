import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
	fetchAllPOS,
	fetchMonthlyPOSRevenue,
	fetchPOS,
} from "@/lib/vivenu/client";
import type { PosRevenueResponse } from "@/types/vivenu/revenue";
import NotFound from "./../../../not-found";

interface PageParam {
	id: string;
}

interface MonthlyData {
	month: string;
	monthDate: string;
	netCount: number;
	ticketRevenue: number;
	feeRevenue: number;
}

function processMonthlyData(posRevenue: PosRevenueResponse): MonthlyData[] {
	const monthMap = new Map<string, MonthlyData>();

	for (const item of posRevenue.results) {
		const month = item["month:createdAt"];
		const monthKey = new Date(month).toLocaleDateString("de-DE", {
			year: "numeric",
			month: "long",
		});

		if (!monthMap.has(month)) {
			monthMap.set(month, {
				month: monthKey,
				monthDate: month,
				netCount: 0,
				ticketRevenue: 0,
				feeRevenue: 0,
			});
		}

		const monthData = monthMap.get(month);
		if (monthData) {
			if (item.itemType === "ticket") {
				monthData.netCount += item.netCount || 0;
				monthData.ticketRevenue += item.total_revenue || 0;
			} else if (item.itemType === "fee") {
				monthData.feeRevenue += item.total_revenue || 0;
			}
		}
	}

	return Array.from(monthMap.values()).sort((a, b) => {
		return new Date(a.monthDate).getTime() - new Date(b.monthDate).getTime();
	});
}

export async function generateStaticParams(): Promise<PageParam[]> {
	const pos = await fetchAllPOS();
	return (
		pos?.map((item) => ({
			id: item._id,
		})) || []
	);
}

export default async function Page({ params }: { params: Promise<PageParam> }) {
	const posId = (await params).id;

	const pos = await fetchPOS(posId);
	const posRevenue = await fetchMonthlyPOSRevenue(posId);

	if (!posRevenue) {
		return <NotFound />;
	}
	const monthlyData = processMonthlyData(posRevenue);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl">{pos?.name}</h1>
				<p className="text-muted-foreground">Monatliche Umsätze</p>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Monat</TableHead>
						<TableHead className="text-right">Tickets</TableHead>
						<TableHead className="text-right">Ticketumsatz</TableHead>
						<TableHead className="text-right">Gebühren</TableHead>
						<TableHead className="text-right">Total</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{monthlyData.map((data) => (
						<TableRow key={data.month}>
							<TableCell className="font-medium">{data.month}</TableCell>
							<TableCell className="text-right">{data.netCount}</TableCell>
							<TableCell className="text-right">
								{formatCurrency(data.ticketRevenue)}
							</TableCell>
							<TableCell className="text-right">
								{formatCurrency(data.feeRevenue)}
							</TableCell>
							<TableCell className="text-right">
								{formatCurrency(data.ticketRevenue + data.feeRevenue)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
