import { ChartLineInteractive } from "@/components/my-ui/revenue-chart";
import { fetchRevenue, fetchTicketSales } from "@/lib/vivenu/client";

export default async function SalesDashboard() {
	const dailyRevenue = await fetchRevenue({
		groupBy: "day:createdAt",
		startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
		endDate: new Date(),
	});
	const dailyTicketSales = await fetchTicketSales({
		groupBy: "day:createdAt",
		dimensions: [],
		startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
		endDate: new Date(),
	});
	return (
		<div className="flex w-full">
			{dailyRevenue && (
				<div className="w-full">
					{dailyRevenue && dailyTicketSales && (
						<ChartLineInteractive
							dailyRevenue={dailyRevenue}
							dailyTicketSales={dailyTicketSales}
						/>
					)}
				</div>
			)}
		</div>
	);
}
