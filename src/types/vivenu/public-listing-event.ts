export enum EventType {
	SINGLE = "SINGLE",
	GROUP = "GROUP",
	RECURRENCE = "RECURRENCE",
}

export enum SaleStatus {
	planned = "planned",
	onSale = "onSale",
	soldOut = "soldOut",
	past = "past",
}

export interface PublicListingEvent {
	_id: string;
	url: string;
	name: string;
	image: string;
	slogan: string;
	sellerId: string;
	start: string; // ISO 8601 date string
	end: string; // ISO 8601 date string
	locationName: string;
	locationStreet: string;
	locationCity: string;
	locationPostal: string;
	locationCountry: string;
	styleOptions: {
		headerStyle: string;
		hideLocationMap: boolean;
		categoryAlignment: number;
		showAvailabilityIndicator: boolean;
		availabilityIndicatorThresholds: number[];
	};
	accountSettings: {
		_id: string;
		enforceAccounts: boolean;
		enforceAuthentication: "DISABLED" | "ENABLED"; // adjust values as needed
	};
	meta: Record<string, unknown>; // empty object or flexible type
	eventType: EventType; // adjust values as needed
	childEvents: string[];
	daySchemeId: string;
	rootId: string;
	seoSettings: {
		_id: string;
		tags: string[];
		noIndex: boolean;
		title: string;
		description: string;
	};
	customSettings: Record<string, unknown>; // empty object or flexible type
	ticketSettings: Record<string, unknown>; // empty object or flexible type
	underShopId: string;
	startingPrice: string;
	showStartDate: boolean;
	showEndDate: boolean;
	showTimeRangeInListing: boolean;
	availabilityIndicator: string; // e.g., "green", "yellow", "red"
	currency: "EUR" | "USD" | string; // specify other currencies if needed
	saleStatus: SaleStatus;
	timezone: string;
	category: string;
	subCategory: string;
}
