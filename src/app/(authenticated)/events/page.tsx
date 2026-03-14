import { Suspense } from "react";
import { fetchTicketSales } from "@/lib/vivenu/client";
import { EventsTableTabs } from "./events-table-tabs";

type PageProps = {
	searchParams: Promise<{ tab?: string }>;
};

const isValidTab = (tab: string | undefined): tab is "upcoming" | "past" =>
	tab === "upcoming" || tab === "past";

export default async function Page({ searchParams }: PageProps) {
	const params = await searchParams;
	const initialTab = isValidTab(params.tab) ? params.tab : "upcoming";

	// Fetch ticket sales and revenue in parallel
	const ticketSales = await fetchTicketSales({
		groupBy: "eventId",
		dimensions: ["event->start", "event->end", "event->attributes.organizerid"],
	});

	// Split events into past and upcoming based on event start date
	// Parse dates once, sort once, partition once
	const now = Date.now();
	const eventsWithTimestamp = (ticketSales?.results ?? []).map((event) => ({
		event,
		timestamp: new Date(event["event->start"] ?? 0).getTime(),
	}));

	// Sort by timestamp ascending (earliest first)
	eventsWithTimestamp.sort((a, b) => a.timestamp - b.timestamp);

	// Partition into past and upcoming
	const splitIndex = eventsWithTimestamp.findIndex(
		({ timestamp }) => timestamp >= now,
	);

	const pastEvents =
		splitIndex === -1
			? eventsWithTimestamp.map(({ event }) => event).reverse()
			: eventsWithTimestamp
					.slice(0, splitIndex)
					.map(({ event }) => event)
					.reverse();

	const upcomingEvents =
		splitIndex === -1
			? []
			: eventsWithTimestamp.slice(splitIndex).map(({ event }) => event);

	return (
		<div className="space-y-8">
			<h1 className="font-bold text-2xl">Veranstaltungen</h1>
			<Suspense fallback={<div>Loading...</div>}>
				<EventsTableTabs
					initialTab={initialTab}
					pastEvents={pastEvents}
					ticketSalesMeta={ticketSales?.meta.eventId ?? {}}
					upcomingEvents={upcomingEvents}
				/>
			</Suspense>
		</div>
	);
}
