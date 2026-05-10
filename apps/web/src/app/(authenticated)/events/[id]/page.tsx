import { organizations } from "@qonto/embed-sdk/server/organizations";
import NotFound from "@/app/not-found";
import { BillingStatusBadge } from "@/components/my-ui/billing-status-badge";
import LabelText from "@/components/my-ui/label-text";
import { Card, CardContent } from "@/components/ui/card";
import { BreadcrumbSetter } from "@/context/breadcrumb-context";
import { getAccessToken } from "@/lib/auth";
import { BillingRecordsService } from "@/lib/dynamodb/services/billing-records";
import { OrganizersService } from "@/lib/dynamodb/services/organizers";
import {
	fetchAllPOS,
	fetchEvent,
	fetchEvents,
	fetchRevenue,
	fetchTicketSales,
} from "@/lib/vivenu/client";
import { EventSummaryCard } from "./event-summary-card";
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
	const organizersService = new OrganizersService();
	const billingRecordsService = new BillingRecordsService();
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

	const organizerId = event.attributes?.organizerid;

	const [organizer, billingRecord, bankAccounts] = await Promise.all([
		organizerId
			? organizersService.getOrganizer(organizerId)
			: Promise.resolve(null),
		billingRecordsService.getBillingRecordByEventId(eventId),
		getAccessToken()
			.then((accessToken) =>
				organizations.getBankAccounts({ operationSettings: { accessToken } }),
			)
			.catch(() => []),
	]);
	return (
		<div className="max-w-4xl">
			<BreadcrumbSetter eventName={event.name} />
			<div className="mb-4 flex items-center justify-between">
				<h1 className="font-bold text-2xl">{event.name}</h1>
				{billingRecord ? (
					<BillingStatusBadge status={billingRecord.billingStatus} />
				) : (
					<BillingStatusBadge status="UNBILLED" />
				)}
			</div>
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
							value={`${organizer?.taxRate !== undefined ? organizer.taxRate * 100 : "??"}%`}
							className="col-span-1"
						/>
					</CardContent>
				</Card>
			</div>
			<div className="mt-4">
				<EventSummaryCard
					event={event}
					ticketSales={ticketSales}
					revenue={revenue}
				/>
			</div>
			<div className="my-8">
				<h2 className="mt-8 font-semibold text-2xl">Abrechnung</h2>
				<RevenueTable
					event={event}
					ticketAnalytics={ticketSales}
					organizer={organizer}
					revenue={revenue}
					pos={pos}
					billingRecord={billingRecord ?? undefined}
					bankAccounts={bankAccounts}
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
