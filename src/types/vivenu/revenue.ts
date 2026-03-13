export enum SalesChannelId {
	WEB = "sch-web",
	POS = "sch-pos",
	INTERNAL = "sch-internal",
}

export interface RevenueResult {
	count: number;
	netCount: number;
	cancellationsCount: number;
	discountsCount: number;
	gross_sales: number;
	cancellations: number;
	discounts: number;
	net_revenue: number;
	taxes: number;
	total_revenue: number;
	salesChannelId: SalesChannelId;
	name: string;
	categoryRef?: string;
	eventId?: string;
	"day:createdAt"?: string;
	itemType?: "fee" | "ticket";
	posId?: string;
}

interface RevenueMetaCategoryRef {
	[categoryRef: string]: {
		label: string;
		subLabel: string;
	};
}

interface RevenueMetaSalesChannelId {
	[salesChannelId: string]: {
		label: string;
	};
}

interface RevenueMeta {
	categoryRef: RevenueMetaCategoryRef;
	salesChannelId: RevenueMetaSalesChannelId;
}

export interface RevenueResponse {
	results: RevenueResult[];
	columnFields: null;
	meta: RevenueMeta;
	truncated: boolean;
}

interface PosRevenueResult {
	count: number;
	netCount: number;
	cancellationsCount: number;
	discountsCount: number;
	gross_sales: number;
	cancellations: number;
	discounts: number;
	net_revenue: number;
	taxes: number;
	total_revenue: number;
	"month:createdAt": string;
	itemType?: "fee" | "ticket";
}

export interface PosRevenueResponse {
	results: PosRevenueResult[];
	columnFields: null;
	meta: Record<string, unknown>;
	truncated: boolean;
}
