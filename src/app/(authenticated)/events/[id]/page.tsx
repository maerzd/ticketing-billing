import { withAuth } from "@workos-inc/authkit-nextjs";
import NotFound from "@/app/not-found";
import LabelText from "@/components/my-ui/label-text";
import { Card, CardContent } from "@/components/ui/card";
import { BreadcrumbSetter } from "@/context/breadcrumb-context";
import { queryOrganizer } from "@/lib/notion/client";
import {
	fetchAllPOS,
	fetchEvent,
	fetchEvents,
	fetchRevenue,
	fetchTicketSales,
} from "@/lib/vivenu/client";
import { EventStatistics } from "./event-statistics";
import RevenueTable from "./revenue-table";
import TicketSalesTable from "./tickets-sold-table";

interface PageParam {
	id: string;
}

export async function generateStaticParams(): Promise<PageParam[]> {
	const events = await fetchEvents();
	return events.rows.map((event) => ({
		id: event._id,
	}));
}

export default async function Page({ params }: { params: Promise<PageParam> }) {
	const eventId = (await params).id;
	const user = await withAuth();
	const [event, ticketSales, revenue, pos] = await Promise.all([
		fetchEvent(eventId),
		fetchTicketSales({
			eventId: eventId,
			groupBy: "ticketTypeId",
			dimensions: ["price", "categoryRef"],
		}),
		fetchRevenue({
			groupBy: "posId",
			eventId: eventId,
			dimensions: ["itemType"],
		}),
		fetchAllPOS(),
	]);

	if (!event) {
		return <NotFound />;
	}

	const organizer = await queryOrganizer(
		event.attributes?.organizerid,
		user.organizationId,
	);
	console.log(event.attributes);
	console.log(organizer);
	return (
		<div className="max-w-4xl">
			<BreadcrumbSetter eventName={event.name} />
			<h1 className="mb-4 font-bold text-2xl">{event.name}</h1>
			<div className="grid gap-4">
				<Card>
					<CardContent className="grid grid-cols-2 gap-4">
						<LabelText
							label="Name"
							value={organizer?.name}
							className="col-span-1"
						/>
						<LabelText
							label="E-Mail"
							value={organizer?.email}
							className="col-span-1"
						/>
						<LabelText
							label="Steuersatz Veranstalter"
							value={`${organizer?.taxRate ?? "??"}%`}
							className="col-span-1"
						/>
					</CardContent>
				</Card>
				<EventStatistics revenue={revenue} ticketSales={ticketSales} />
			</div>
			<div className="my-8">
				<h2 className="mt-8 font-semibold text-2xl">Abrechnung</h2>
				<RevenueTable
					ticketAnalytics={ticketSales}
					organizer={organizer}
					revenue={revenue}
					pos={pos}
				/>
			</div>
			<div className="my-8">
				<h2 className="mt-8 font-semibold text-2xl">
					{event.name} am{" "}
					{new Date(event.start).toLocaleDateString("de-DE", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					})}
				</h2>
				<p className="text-muted-foreground">
					Ticket und Umsatz nach Kategorie und Tickettyp gruppiert
				</p>
				<TicketSalesTable event={event} ticketSales={ticketSales} />
			</div>
		</div>
	);
}
