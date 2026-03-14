"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClickableTableRow } from "@/components/my-ui/clickable-table-row";
import { StatusLed } from "@/components/my-ui/status-led";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalDateTime } from "@/lib/date-time";
import type { TicketSalesResult } from "@/types/vivenu/ticket-sales";

interface EventsTableTabsProps {
	pastEvents: TicketSalesResult[];
	ticketSalesMeta: Record<string, { label: string }>;
	upcomingEvents: TicketSalesResult[];
	initialTab?: "upcoming" | "past";
}

const isValidTab = (tab: string | null): tab is "upcoming" | "past" =>
	tab === "upcoming" || tab === "past";

function EventsTable({
	events,
	ticketSalesMeta,
}: {
	events: TicketSalesResult[];
	ticketSalesMeta: Record<string, { label: string }>;
}) {
	if (events.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				Keine Veranstaltungen gefunden
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						<span className="sr-only">Status</span>
					</TableHead>
					<TableHead>Datum</TableHead>
					<TableHead>Name</TableHead>
					<TableHead>Tickets</TableHead>
					<TableHead>Veranstalter</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{events.map((ticketSale: TicketSalesResult) => {
					const eventMeta = ticketSalesMeta[ticketSale.eventId];
					return (
						<ClickableTableRow
							className="cursor-pointer transition-colors hover:bg-muted/50"
							href={`/events/${ticketSale.eventId}`}
							key={ticketSale.eventId}
						>
							<TableCell>
								<StatusLed
									sellEnd={ticketSale["event->end"]}
									sellStart={new Date()}
								/>
							</TableCell>
							<TableCell>
								<LocalDateTime
									date={ticketSale["event->start"]}
									format={{ dateStyle: "short" }}
								/>
							</TableCell>
							<TableCell>{eventMeta?.label ?? ticketSale.eventId}</TableCell>

							<TableCell>{ticketSale.count ?? 0}</TableCell>
							<TableCell>
								{ticketSale["event->attributes.organizerid"]}
							</TableCell>
						</ClickableTableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

export function EventsTableTabs({
	pastEvents,
	ticketSalesMeta,
	upcomingEvents,
	initialTab = "upcoming",
}: EventsTableTabsProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab");
	const selectedTab = isValidTab(tabParam) ? tabParam : initialTab;

	const handleTabChange = (tab: string) => {
		if (!isValidTab(tab) || tab === tabParam) {
			return;
		}

		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", tab);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	};

	return (
		<Tabs
			className="w-full"
			onValueChange={handleTabChange}
			value={selectedTab}
		>
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="upcoming">
					Bevorstehend ({upcomingEvents.length})
				</TabsTrigger>
				<TabsTrigger value="past">Vergangen ({pastEvents.length})</TabsTrigger>
			</TabsList>
			<TabsContent value="upcoming">
				<EventsTable
					events={upcomingEvents}
					ticketSalesMeta={ticketSalesMeta}
				/>
			</TabsContent>
			<TabsContent value="past">
				<EventsTable events={pastEvents} ticketSalesMeta={ticketSalesMeta} />
			</TabsContent>
		</Tabs>
	);
}
