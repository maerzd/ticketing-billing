import type { VivenuEvent as VivenuEventModel } from "@ticketing-billing/types/vivenu/event";
import type { Ticket } from "@ticketing-billing/types/vivenu/ticket";

export type FilterCondition = {
	value: string | Date | string[] | Date[];
	key: string;
	operator: string;
	type: string;
	caseInsensitive?: boolean;
};

export type DateOperator = "gte" | "lte" | "eq";

export interface EventResponse {
	rows: VivenuEventModel[];
	total?: number;
	hasMore?: boolean;
	nextToken?: string;
}

export interface FetchEventsOptions {
	top?: number;
	skip?: number;
	fetchAll?: boolean;
	eventIds?: string[];
}

export interface TicketSalesFilters {
	groupBy: "ticketTypeId" | "salesChannelId" | "eventId" | "day:createdAt";
	dimensions?: (
		| "event->start"
		| "event->end"
		| "categoryRef"
		| "price"
		| "salesChannelId"
		| "event->attributes.organizerid"
	)[];
	eventId?: string;
	organizerId?: string;
	eventStartDate?: Date;
	startDate?: Date;
	endDate?: Date;
	dateOperator?: DateOperator;
}

export interface RevenueFilters {
	groupBy?: "salesChannelId" | "eventId" | "day:createdAt" | "posId";
	eventId?: string;
	organizerId?: string;
	eventStartDate?: Date;
	startDate?: Date;
	endDate?: Date;
	dateOperator?: DateOperator;
	dimensions?: string[];
}

export interface OrganizerTicketSalesFilters {
	organizerId?: string;
	startDate?: Date;
	endDate?: Date;
	dateField?: "event->start" | "event->end" | "createdAt";
	paymentStatus?: string[];
	itemTypes?: ("ticket" | "item")[];
}

export interface HubbleEventsFilters {
	organizerId?: string;
	eventStartDate?: Date;
	dateOperator?: DateOperator;
}

export interface HubbleEventResponse {
	docs: VivenuEventModel[];
	total: number;
	hasMore?: boolean;
	nextToken?: string;
}

export interface HubbleTicketsFilters {
	organizerId?: string;
	eventId?: string;
	status?: ("VALID" | "RESERVED" | "DETAILSREQUIRED")[];
}

export interface HubbleTicketResponse {
	docs: Ticket[];
	total: number;
	hasMore?: boolean;
	nextToken?: string;
}

export interface FetchPosOptions {
	top?: number;
	skip?: number;
	sellerId?: string;
}

export interface InviteUserPayload {
	name: string;
	email: string;
	roles: string[];
	permissions: string[];
	hasSellerAccess: boolean;
	hasIdentityProvider: boolean;
	suppressEmail: boolean;
	origin: string;
}

export interface InviteUserResponse {
	_id: string;
}

export interface InviteUserResult {
	success: boolean;
	data?: InviteUserResponse;
	error?: string;
}

export type { AccessUser } from "@ticketing-billing/types/vivenu/accessuser";
export type { VivenuEvent } from "@ticketing-billing/types/vivenu/event";
export type { PosDevice } from "@ticketing-billing/types/vivenu/pos";
export type {
	PosRevenueResponse,
	RevenueResponse,
} from "@ticketing-billing/types/vivenu/revenue";
export type { TicketSales } from "@ticketing-billing/types/vivenu/ticket-sales";
export type { UsersResponse } from "@ticketing-billing/types/vivenu/user";

// Authentication types
export interface VivenuLoginResponse {
	jwt: string;
	expiresIn?: number;
	userId?: string;
	email?: string;
}
