import { getVivenuHubbleToken } from "@/lib/vivenu/auth";
import { VivenuClient } from "@/lib/vivenu/client";
import { VivenuAnalyticsService } from "@/lib/vivenu/services/analytics";
import { VivenuEventsService } from "@/lib/vivenu/services/events";
import { VivenuPosService } from "@/lib/vivenu/services/pos";
import { VivenuTicketsService } from "@/lib/vivenu/services/tickets";
import { VivenuUsersService } from "@/lib/vivenu/services/users";
import type {
	AccessUser,
	EventResponse,
	FetchEventsOptions,
	FetchPosOptions,
	HubbleEventResponse,
	HubbleEventsFilters,
	HubbleTicketResponse,
	HubbleTicketsFilters,
	InviteUserPayload,
	InviteUserResult,
	PosDevice,
	PosRevenueResponse,
	RevenueFilters,
	RevenueResponse,
	TicketSales,
	TicketSalesFilters,
	UsersResponse,
	VivenuEvent,
} from "@/lib/vivenu/types";
import type { Me } from "@/types/vivenu/me";

const createHubbleServices = async () => {
	const token = await getVivenuHubbleToken();
	const client = new VivenuClient({ accessToken: token });
	return {
		events: new VivenuEventsService(client),
		analytics: new VivenuAnalyticsService(client),
		tickets: new VivenuTicketsService(client),
		pos: new VivenuPosService(client),
		users: new VivenuUsersService(client),
	};
};

export const fetchEvents = async (
	options: FetchEventsOptions = {},
): Promise<EventResponse> =>
	(await createHubbleServices()).events.fetchEvents(options);

export const fetchEvent = async (
	eventId: string,
): Promise<VivenuEvent | null> =>
	(await createHubbleServices()).events.fetchEvent(eventId);

export const fetchTicketSales = async (
	filters: TicketSalesFilters,
): Promise<TicketSales | null> =>
	(await createHubbleServices()).analytics.fetchTicketSales(filters);

export const fetchTicketInventory = async (
	filters: TicketSalesFilters,
): Promise<TicketSales | null> =>
	(await createHubbleServices()).analytics.fetchTicketInventory(filters);

export const fetchRevenue = async (
	filters: RevenueFilters,
): Promise<RevenueResponse | null> =>
	(await createHubbleServices()).analytics.fetchRevenue(filters);

export const fetchMe = async (): Promise<Me | null> =>
	(await createHubbleServices()).users.fetchMe();

export const hubbleSearchEvents = async (
	filters: HubbleEventsFilters,
): Promise<HubbleEventResponse | null> =>
	(await createHubbleServices()).events.hubbleSearchEvents(filters);

export const hubbleSearchTickets = async (
	filters: HubbleTicketsFilters,
): Promise<HubbleTicketResponse | null> =>
	(await createHubbleServices()).tickets.hubbleSearchTickets(filters);

export const fetchMonthlyPOSRevenue = async (
	posId: string,
): Promise<PosRevenueResponse | null> =>
	(await createHubbleServices()).pos.fetchMonthlyPOSRevenue(posId);

export const fetchAllPOS = async (
	options?: FetchPosOptions & { fetchAll?: boolean },
): Promise<PosDevice[] | null> =>
	(await createHubbleServices()).pos.fetchAllPOS(options);

export const fetchPOS = async (
	posId: string | undefined,
): Promise<PosDevice | null> =>
	(await createHubbleServices()).pos.fetchPOS(posId);

export const fetchAccessUser = async (
	orgId: string,
): Promise<AccessUser | null> =>
	(await createHubbleServices()).users.fetchAccessUser(orgId);

export const inviteUser = async (
	payload: InviteUserPayload,
): Promise<InviteUserResult> =>
	(await createHubbleServices()).users.inviteUser(payload);

export const fetchUsers = async (
	top: number = 50,
	skip: number = 0,
): Promise<UsersResponse | null> =>
	(await createHubbleServices()).users.fetchUsers(top, skip);

export type {
	DateOperator,
	EventResponse,
	FetchEventsOptions,
	FetchPosOptions,
	HubbleEventResponse,
	HubbleEventsFilters,
	HubbleTicketResponse,
	HubbleTicketsFilters,
	InviteUserPayload,
	InviteUserResponse,
	InviteUserResult,
	OrganizerTicketSalesFilters,
	PosRevenueResponse,
	RevenueFilters,
	TicketSalesFilters,
} from "@/lib/vivenu/types";
