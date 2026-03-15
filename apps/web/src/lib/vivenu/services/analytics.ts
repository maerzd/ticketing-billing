import type { VivenuClient } from "@/lib/vivenu/client";
import type {
	FilterCondition,
	RevenueFilters,
	RevenueResponse,
	TicketSales,
	TicketSalesFilters,
} from "@/lib/vivenu/types";

const buildAnalyticsConditions = (
	filters: Pick<
		TicketSalesFilters,
		"eventId" | "organizerId" | "eventStartDate" | "startDate" | "endDate"
	> & {
		dateOperator?: "gte" | "lte" | "eq";
	},
): FilterCondition[] => {
	const {
		eventId,
		organizerId,
		eventStartDate,
		startDate,
		endDate,
		dateOperator = "gte",
	} = filters;

	const conditions: FilterCondition[] = [];

	if (eventStartDate) {
		conditions.push({
			type: "date",
			value: eventStartDate,
			operator: dateOperator,
			key: "event->start",
		});
	}

	if (startDate) {
		conditions.push({
			type: "date",
			value: startDate,
			operator: "gte",
			key: "createdAt",
		});
	}

	if (endDate) {
		conditions.push({
			type: "date",
			value: endDate,
			operator: "lte",
			key: "createdAt",
		});
	}

	if (eventId) {
		conditions.push({
			value: eventId,
			key: "eventId",
			operator: "eq",
			type: "string",
			caseInsensitive: false,
		});
	}

	if (organizerId) {
		conditions.push({
			value: organizerId,
			key: "event->attributes.organizerid",
			operator: "eq",
			type: "string",
			caseInsensitive: false,
		});
	}

	return conditions;
};

const buildAnalyticsBody = (
	conditions: FilterCondition[],
	groupBy: string,
	dimensions?: string[],
) => ({
	filter: [
		{
			$and: conditions,
		},
	],
	groupBy,
	dimensions,
	aggregateConfig: { weekStart: 1, timeZone: "Europe/Berlin" },
});

export class VivenuAnalyticsService {
	constructor(private readonly client: VivenuClient) {}

	async fetchTicketSales(
		filters: TicketSalesFilters,
	): Promise<TicketSales | null> {
		try {
			const conditions = buildAnalyticsConditions(filters);
			const body = buildAnalyticsBody(
				conditions,
				filters.groupBy,
				filters.dimensions,
			);

			return await this.client.hubblePost<TicketSales>(
				"/analytics/tickets",
				body,
			);
		} catch (error) {
			console.error("[VIVENU] fetchTicketSales error:", error);
			return null;
		}
	}

	async fetchTicketInventory(
		filters: TicketSalesFilters,
	): Promise<TicketSales | null> {
		try {
			const conditions = buildAnalyticsConditions(filters);
			const body = buildAnalyticsBody(
				conditions,
				filters.groupBy,
				filters.dimensions,
			);

			return await this.client.hubblePost<TicketSales>(
				"/analytics/ticketinventory",
				body,
			);
		} catch (error) {
			console.error("[VIVENU] fetchTicketInventory error:", error);
			return null;
		}
	}

	async fetchRevenue(filters: RevenueFilters): Promise<RevenueResponse | null> {
		const {
			groupBy = "salesChannelId",
			dimensions = ["name", "categoryRef"],
			...rest
		} = filters;

		try {
			const conditions = buildAnalyticsConditions(rest);
			const body = buildAnalyticsBody(conditions, groupBy, dimensions);

			return await this.client.hubblePost<RevenueResponse>(
				"/analytics/transactions/revenue",
				body,
			);
		} catch (error) {
			console.error("[VIVENU] fetchRevenue error:", error);
			return null;
		}
	}
}
