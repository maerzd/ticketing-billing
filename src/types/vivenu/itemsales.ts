export interface ItemSalesResult {
	count: number;
	taxes: number;
	total: number;
	netTotal: number;
	eventId: string;
	"day:event->start": string;
	"event->attributes.organizerid": string;
}

interface ItemSalesMetaEvent {
	label: string;
	subLabel: string;
}

interface ItemSalesMeta {
	eventId: Record<string, ItemSalesMetaEvent>;
}

export interface ItemSales {
	results: ItemSalesResult[];
	columnFields: null;
	meta: ItemSalesMeta;
	truncated: boolean;
}
