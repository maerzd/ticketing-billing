import type { VivenuClient } from "@/lib/vivenu/client";
import type {
    EventResponse,
    FetchEventsOptions,
    FilterCondition,
    HubbleEventResponse,
    HubbleEventsFilters,
    VivenuEvent,
} from "@/lib/vivenu/types";

export class VivenuEventsService {
    constructor(private readonly client: VivenuClient) { }

    async fetchEvents(options: FetchEventsOptions = {}): Promise<EventResponse> {
        const result = await this.client.fetchApiPaginated<VivenuEvent>(
            "/events",
            options,
        );

        return {
            rows: result.rows,
            total: result.total,
            hasMore: result.hasMore,
            nextToken: result.nextToken,
        };
    }

    async fetchEvent(eventId: string): Promise<VivenuEvent | null> {
        try {
            return await this.client.apiGet<VivenuEvent>(`/events/${eventId}`);
        } catch (error) {
            console.error("[VIVENU] fetchEvent error:", error);
            return null;
        }
    }

    async hubbleSearchEvents(
        filters: HubbleEventsFilters,
    ): Promise<HubbleEventResponse | null> {
        const { organizerId, eventStartDate, dateOperator = "gte" } = filters;
        const conditions: FilterCondition[] = [];

        if (organizerId) {
            conditions.push({
                value: organizerId,
                key: "attributes.organizerid",
                operator: "eq",
                type: "string",
                caseInsensitive: false,
            });
        }

        if (eventStartDate) {
            conditions.push({
                key: "start",
                value: eventStartDate,
                operator: dateOperator,
                type: "date",
            });
        }

        try {
            return await this.client.hubblePost<HubbleEventResponse>("/search/events", {
                skip: 0,
                top: 100,
                query: { $and: conditions },
                order: [{ by: "start", direction: "ASC" }],
                select: [
                    "rootEvent->name as rootName",
                    "rootEvent->locationName as rootLocationName",
                    "rootEvent->attributes as rootAttributes",
                    "rootEvent->image as rootImage",
                ],
            });
        } catch (error) {
            console.error("[VIVENU] hubbleSearchEvents error:", error);
            return null;
        }
    }
}
