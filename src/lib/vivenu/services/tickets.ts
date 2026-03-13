import type { VivenuClient } from "@/lib/vivenu/client";
import type {
	FilterCondition,
	HubbleTicketResponse,
	HubbleTicketsFilters,
} from "@/lib/vivenu/types";

export class VivenuTicketsService {
	constructor(private readonly client: VivenuClient) {}

	async hubbleSearchTickets(
		filters: HubbleTicketsFilters,
	): Promise<HubbleTicketResponse | null> {
		const { organizerId, eventId, status } = filters;
		const conditions: FilterCondition[] = [];

		if (organizerId) {
			conditions.push({
				value: organizerId,
				key: "event->attributes.organizerid",
				operator: "eq",
				type: "string",
				caseInsensitive: false,
			});
		}

		if (eventId) {
			conditions.push({
				key: "eventId",
				value: eventId,
				operator: "eq",
				type: "string",
			});
		}

		if (status && status.length > 0) {
			conditions.push({
				key: "status",
				value: status,
				operator: "oneOf",
				type: "array",
			});
		}

		try {
			return await this.client.hubblePost<HubbleTicketResponse>(
				"/search/tickets",
				{
					skip: 0,
					top: 1000,
					query: { $and: conditions },
					order: [{ by: "createdAt", direction: "DESC" }],
				},
			);
		} catch (error) {
			console.error("[VIVENU] hubbleSearchTickets error:", error);
			return null;
		}
	}
}
