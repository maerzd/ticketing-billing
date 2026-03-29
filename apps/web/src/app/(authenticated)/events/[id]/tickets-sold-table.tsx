import type { VivenuEvent } from "@ticketing-billing/types/vivenu/event";
import type {
	TicketSales,
	TicketSalesResult,
} from "@ticketing-billing/types/vivenu/ticket-sales";
import React from "react";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

function groupTickets(ticketSales: TicketSales | null) {
	return ticketSales?.results.reduce(
		(acc, ticket) => {
			const categoryRef = ticket.categoryRef;
			const ticketTypeId = ticket.ticketTypeId;
			const ticketTypeLabel =
				ticketSales?.meta.ticketTypeId[ticketTypeId].label || ticketTypeId;
			const categoryLabel =
				ticketSales?.meta.categoryRef[categoryRef].label || categoryRef;

			if (!acc[categoryRef]) {
				acc[categoryRef] = {
					categoryLabel,
					ticketTypes: {},
				};
			}
			if (!acc[categoryRef].ticketTypes[ticketTypeId]) {
				acc[categoryRef].ticketTypes[ticketTypeId] = {
					ticketTypeLabel,
					tickets: [],
				};
			}
			acc[categoryRef].ticketTypes[ticketTypeId].tickets.push(ticket);
			return acc;
		},
		{} as Record<
			string,
			{
				categoryLabel: string;
				ticketTypes: Record<
					string,
					{ ticketTypeLabel: string; tickets: TicketSalesResult[] }
				>;
			}
		>,
	);
}

export default function TicketSalesTable({
	ticketSales,
	event,
	currency = "EUR",
	showRevenue = true,
}: {
	ticketSales: TicketSales | null;
	event: VivenuEvent | null;
	currency?: string;
	showRevenue?: boolean;
}) {
	// Check if there are no results
	if (!ticketSales || ticketSales.results.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				Leider wurden für diese Veranstaltung bislang noch keine Tickets
				gekauft.
			</div>
		);
	}

	const groupedTicketsSold = groupTickets(ticketSales);

	// Calculate total countPos, total countWeb, total count, and total revenue
	const totalCountPos =
		ticketSales?.results.reduce(
			(sum, ticket) => sum + (ticket.countPos ?? 0),
			0,
		) ?? 0;
	const totalCountWeb =
		ticketSales?.results.reduce(
			(sum, ticket) => sum + (ticket.countOnline ?? 0),
			0,
		) ?? 0;
	const totalCount =
		ticketSales?.results.reduce(
			(sum, ticket) => sum + (ticket.count ?? 0),
			0,
		) ?? 0;
	const totalRevenue =
		ticketSales?.results.reduce(
			(sum, ticket) => sum + (ticket.count ?? 0) * (ticket.price ?? 0),
			0,
		) ?? 0;

	return (
		<Table>
			<TableHeader>
				<TableRow className="">
					<TableHead>Kategorie</TableHead>
					<TableHead className="text-right">POS</TableHead>
					<TableHead className="text-right">WEB</TableHead>
					<TableHead className="text-right">Gesamt</TableHead>
					<TableHead className="text-right">Volumen</TableHead>
					{showRevenue && (
						<TableHead className="font-semibold">Umsatz</TableHead>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{groupedTicketsSold &&
					Object.entries(groupedTicketsSold).map(([categoryRef, category]) => {
						// Calculate sums per category
						const categorySum = Object.values(category.ticketTypes).reduce(
							(acc, ticketType) => {
								// Sum all tickets in this ticketType
								return ticketType.tickets.reduce(
									(innerAcc, ticket) => ({
										countPos: innerAcc.countPos + (ticket.countPos ?? 0),
										countWeb: innerAcc.countWeb + (ticket.countOnline ?? 0),
										count: innerAcc.count + (ticket.count ?? 0),
										countVolume:
											innerAcc.countVolume + (ticket.countVolume ?? 0),
										revenue:
											innerAcc.revenue +
											(ticket.count ?? 0) * (ticket.price ?? 0),
									}),
									acc,
								);
							},
							{
								countPos: 0,
								countWeb: 0,
								count: 0,
								revenue: 0,
								countVolume: 0,
							},
						);

						return (
							<React.Fragment key={categoryRef}>
								<TableRow>
									<TableCell colSpan={1} className="bg-muted font-medium">
										{category.categoryLabel}
									</TableCell>
									<TableCell className="bg-muted text-right font-medium">
										{categorySum.countPos}
									</TableCell>
									<TableCell className="bg-muted text-right font-medium">
										{categorySum.countWeb}
									</TableCell>
									<TableCell className="bg-muted text-right font-medium">
										{categorySum.count}
									</TableCell>
									<TableCell className="bg-muted text-right font-medium">
										{categorySum.countVolume}
									</TableCell>
									{showRevenue && (
										<TableCell className="bg-muted text-right font-medium">
											{formatCurrency(categorySum.revenue)}
										</TableCell>
									)}
								</TableRow>
								<TableRow>
									<TableCell colSpan={showRevenue ? 6 : 5} className="p-0">
										<Progress
											value={
												categorySum.countVolume > 0
													? (categorySum.count / categorySum.countVolume) * 100
													: 0
											}
											className="h-1 rounded-none"
										/>
									</TableCell>
								</TableRow>
								{Object.entries(category.ticketTypes).map(
									([ticketTypeId, ticketType]) =>
										ticketType.tickets.map((ticket, _) => (
											<TableRow key={`${ticketTypeId}-${ticket.categoryRef}`}>
												<TableCell className="pl-6">
													{ticketType.ticketTypeLabel} (
													{formatCurrency(
														event?.tickets?.find(
															(t) => t._id === ticket.ticketTypeId,
														)?.price ??
															ticket.price ??
															0,
													)}
													)
												</TableCell>
												<TableCell className="text-right">
													{ticket.countPos ?? 0}
												</TableCell>
												<TableCell className="text-right">
													{ticket.countOnline ?? 0}
												</TableCell>
												<TableCell className="text-right">
													{ticket.count ?? 0}
												</TableCell>
												<TableCell className="text-right">
													{ticket.countVolume ?? 0}
												</TableCell>
												{showRevenue && (
													<TableCell className="text-right">
														{formatCurrency(
															(ticket.count ?? 0) * (ticket.price ?? 0),
														)}
													</TableCell>
												)}
											</TableRow>
										)),
								)}
							</React.Fragment>
						);
					})}
			</TableBody>
			<TableFooter>
				<TableRow className="font-black">
					<TableCell colSpan={1}>Gesamt</TableCell>
					<TableCell className="text-right">{totalCountPos}</TableCell>
					<TableCell className="text-right">{totalCountWeb}</TableCell>
					<TableCell className="text-right">{totalCount}</TableCell>
					<TableCell className="text-right">{event?.maxAmount}*</TableCell>
					{showRevenue && (
						<TableCell className="text-right">
							{formatCurrency(totalRevenue, currency)}
						</TableCell>
					)}
				</TableRow>
				<TableRow>
					<TableCell colSpan={showRevenue ? 6 : 5} className="p-0">
						<Progress
							value={
								(event?.maxAmount ?? 0) > 0
									? (totalCount / (event?.maxAmount ?? 0)) * 100
									: 0
							}
							className="h-1 rounded-none"
						/>
					</TableCell>
				</TableRow>
			</TableFooter>
			<TableCaption>
				*Das verfügbare Gesamtvolumen kann durch eine Einschränkung des
				Ticketkontingents von der Summe der Volumen je Kategorie abweichen.
			</TableCaption>
		</Table>
	);
}
