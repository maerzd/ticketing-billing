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

const createServices = (token: string) => {
	const client = new VivenuClient({ accessToken: token });

	return {
		events: new VivenuEventsService(client),
		analytics: new VivenuAnalyticsService(client),
		tickets: new VivenuTicketsService(client),
		pos: new VivenuPosService(client),
		users: new VivenuUsersService(client),
	};
};

/**
 * Create services with automatic Hubble JWT authentication
 * Gets the JWT token from cookies or re-authenticates if needed
 */
const createHubbleServices = async () => {
	const token = await getVivenuHubbleToken();
	return createServices(token);
};

export const fetchEvents = async (
	token: string,
	options: FetchEventsOptions = {},
): Promise<EventResponse> => createServices(token).events.fetchEvents(options);

export const fetchEvent = async (
	token: string,
	eventId: string,
): Promise<VivenuEvent | null> =>
	createServices(token).events.fetchEvent(eventId);

export const fetchTicketSales = async (
	token: string,
	filters: TicketSalesFilters,
): Promise<TicketSales | null> =>
	createServices(token).analytics.fetchTicketSales(filters);

export const fetchTicketInventory = async (
	token: string,
	filters: TicketSalesFilters,
): Promise<TicketSales | null> =>
	createServices(token).analytics.fetchTicketInventory(filters);

export const fetchRevenue = async (
	token: string,
	filters: RevenueFilters,
): Promise<RevenueResponse | null> =>
	createServices(token).analytics.fetchRevenue(filters);

export const fetchMe = async (token: string): Promise<Me | null> =>
	createServices(token).users.fetchMe();

export const hubbleSearchEvents = async (
	token: string,
	filters: HubbleEventsFilters,
): Promise<HubbleEventResponse | null> =>
	createServices(token).events.hubbleSearchEvents(filters);

export const hubbleSearchTickets = async (
	token: string,
	filters: HubbleTicketsFilters,
): Promise<HubbleTicketResponse | null> =>
	createServices(token).tickets.hubbleSearchTickets(filters);

export const fetchMonthlyPOSRevenue = async (
	token: string,
	posId: string,
): Promise<PosRevenueResponse | null> =>
	createServices(token).pos.fetchMonthlyPOSRevenue(posId);

export const fetchAllPOS = async (
	token: string,
	options?: FetchPosOptions & { fetchAll?: boolean },
): Promise<PosDevice[] | null> =>
	createServices(token).pos.fetchAllPOS(options);

export const fetchPOS = async (
	token: string,
	posId: string | undefined,
): Promise<PosDevice | null> => createServices(token).pos.fetchPOS(posId);

export const fetchAccessUser = async (
	token: string,
	orgId: string,
): Promise<AccessUser | null> =>
	createServices(token).users.fetchAccessUser(orgId);

export const inviteUser = async (
	token: string,
	payload: InviteUserPayload,
): Promise<InviteUserResult> => createServices(token).users.inviteUser(payload);

export const fetchUsers = async (
	token: string,
	top: number = 50,
	skip: number = 0,
): Promise<UsersResponse | null> =>
	createServices(token).users.fetchUsers(top, skip);

// ============================================================================
// Hubble Functions with Automatic Authentication
// These functions automatically handle JWT authentication for Hubble endpoints
// ============================================================================

/**
 * Search events via Hubble with automatic authentication
 */
export const hubbleSearchEventsAuth = async (
	filters: HubbleEventsFilters,
): Promise<HubbleEventResponse | null> => {
	const services = await createHubbleServices();
	return services.events.hubbleSearchEvents(filters);
};

/**
 * Search tickets via Hubble with automatic authentication
 */
export const hubbleSearchTicketsAuth = async (
	filters: HubbleTicketsFilters,
): Promise<HubbleTicketResponse | null> => {
	const services = await createHubbleServices();
	return services.tickets.hubbleSearchTickets(filters);
};

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
	RevenueFilters,
	TicketSalesFilters,
} from "@/lib/vivenu/types";
