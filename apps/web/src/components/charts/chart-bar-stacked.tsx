"use client";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

export function ChartBarStacked({
	title,
	description,
	chartConfig,
	chartData,
	dataKey,
}: Readonly<{
	title: string;
	description: string;
	chartConfig: ChartConfig;
	chartData: any[];
	dataKey: string;
	dataName: string;
}>) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="max-h-40">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey={dataKey}
							tickLine={false}
							tickMargin={10}
							axisLine={false}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							dataKey="webCount"
							stackId="a"
							fill="var(--chart-1)"
							radius={[4, 4, 0, 0]}
						/>
						<Bar
							dataKey="posCount"
							stackId="b"
							fill="var(--chart-2)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
