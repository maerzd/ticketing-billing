export interface TicketSalesResult {
	count: number;
	countPos: number;
	countOnline: number;
	countFree: number;
	countTransfer: number;
	countReserved: number;
	ticketTypeId: string;
	salesChannelId: string;
	price?: number;
	categoryRef: string;
	"event->start"?: string;
	"event->end"?: string;
	"event->attributes.organizerid"?: string;
	eventId: string;
	"day:createdAt"?: string;
	countVolume?: number;
}

interface TicketAnalyticsMetaLabel {
	label: string;
	subLabel: string;
}

export interface TicketSales {
	results: TicketSalesResult[];
	columnFields: null;
	meta: {
		ticketTypeId: {
			[key: string]: TicketAnalyticsMetaLabel;
		};
		salesChannelId: {
			[key: string]: TicketAnalyticsMetaLabel;
		};
		categoryRef: {
			[key: string]: TicketAnalyticsMetaLabel;
		};
		eventId: {
			[key: string]: TicketAnalyticsMetaLabel;
		};
	};
	truncated: boolean;
}
