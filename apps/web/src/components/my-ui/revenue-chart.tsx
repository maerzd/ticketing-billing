"use client";

import type { RevenueResponse } from "@ticketing-billing/types/vivenu/revenue";
import type { TicketSales } from "@ticketing-billing/types/vivenu/ticket-sales";
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/utils";

export const description = "An interactive line chart";

const chartConfig = {
	count: {
		label: "Anzahl Tickets",
		color: "var(--chart-1)",
	},
	net_revenue: {
		label: "Netto Umsatz",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export function ChartLineInteractive({
	dailyRevenue,
	dailyTicketSales,
}: {
	dailyRevenue: RevenueResponse;
	dailyTicketSales: TicketSales;
}) {
	const [activeChart, setActiveChart] =
		React.useState<keyof typeof chartConfig>("net_revenue");

	// Merge data by date
	const mergedData = React.useMemo(() => {
		const dataMap = new Map<
			string,
			{ date: string; count: number; net_revenue: number }
		>();

		// Add ticket sales data
		for (const item of dailyTicketSales.results) {
			const date = item["day:createdAt"];
			if (date) {
				dataMap.set(date, {
					date,
					count: item.count || 0,
					net_revenue: 0,
				});
			}
		}

		// Add revenue data
		for (const item of dailyRevenue.results) {
			const date = item["day:createdAt"];
			if (date) {
				const existing = dataMap.get(date);
				if (existing) {
					existing.net_revenue = item.net_revenue || 0;
				} else {
					dataMap.set(date, {
						date,
						count: 0,
						net_revenue: item.net_revenue || 0,
					});
				}
			}
		}

		return Array.from(dataMap.values()).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [dailyRevenue, dailyTicketSales]);

	const total = React.useMemo(
		() => ({
			count: dailyTicketSales.results.reduce(
				(acc, curr) => acc + (curr.count || 0),
				0,
			),
			net_revenue: dailyRevenue.results.reduce(
				(acc, curr) => acc + (curr.net_revenue || 0),
				0,
			),
		}),
		[dailyRevenue, dailyTicketSales],
	);

	const latest = React.useMemo(() => {
		const last = dailyRevenue.results.at(-1);
		const lastTicket = dailyTicketSales.results.at(-1);
		return {
			count: lastTicket?.count ?? 0,
			net_revenue: last?.net_revenue ?? 0,
		};
	}, [dailyRevenue, dailyTicketSales]);

	return (
		<Card className="py-4 sm:py-0">
			<CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
				<div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
					<CardTitle>Verkäufe</CardTitle>
					<CardDescription>Tickets und Umsatz.</CardDescription>
				</div>
				<div className="flex">
					{["count", "net_revenue"].map((key) => {
						const chart = key as keyof typeof chartConfig;
						return (
							<button
								type="button"
								key={chart}
								data-active={activeChart === chart}
								className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
								onClick={() => setActiveChart(chart)}
							>
								<span className="text-muted-foreground text-xs">
									{chartConfig[chart].label}
								</span>
								<span className="font-bold text-lg leading-none sm:text-3xl">
									{key === "net_revenue"
										? formatNumber(total.net_revenue, 0)
										: formatNumber(total.count, 0)}{" "}
								</span>
								<span className="block text-muted-foreground text-xs">
									Heute:{" "}
									{key === "net_revenue"
										? formatNumber(latest.net_revenue, 0)
										: formatNumber(latest.count, 0)}{" "}
								</span>
							</button>
						);
					})}
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:p-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-62.5 w-full"
				>
					<LineChart
						accessibilityLayer
						data={mergedData}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("de-DE", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<YAxis axisLine={false} tickLine={false} tickMargin={8} />
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="w-37.5"
									nameKey={activeChart}
									labelFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString("de-DE", {
											month: "short",
											day: "numeric",
											year: "numeric",
										});
									}}
								/>
							}
						/>
						<Line
							dataKey={activeChart}
							type="monotone"
							stroke={`var(--color-${activeChart})`}
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
