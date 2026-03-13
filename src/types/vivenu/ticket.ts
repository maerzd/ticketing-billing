export enum TicketStatus {
	VALID = "VALID",
	INVALID = "INVALID",
	RESERVED = "RESERVED",
	DETAILSREQUIRED = "DETAILSREQUIRED",
	BLANK = "BLANK",
}

interface SeatingInfo {
	_type: number;
	statusId: string;
	_id?: string;
	categoryId?: string;
	name?: string;
	seatType?: string;
	sectionName?: string;
	groupName?: string;
	rowName?: string;
	seatName?: string;
	gate?: string;
}

export interface Ticket {
	_id: string;
	sellerId: string;
	company?: string;
	name: string;
	firstname?: string;
	lastname?: string;
	email: string;
	street?: string;
	line2?: string;
	city?: string;
	postal?: string;
	state?: string;
	country?: string;
	eventId: string;
	rootEventId?: string;
	posId?: string;
	underShopId?: string;
	categoryRef: string;
	categoryName: string;
	ticketTypeId: string;
	slotId?: string;
	triggeredBy: string[];
	ticketName: string;
	currency: string;
	regularPrice: number;
	realPrice: number;
	completed?: boolean;
	createdAt: string;
	updatedAt: string;
	expiresAt?: string;
	status: string;
	secret: string;
	barcode: string;
	seat?: string;
	seatingInfo?: SeatingInfo;
	type: string;
	origin: TicketStatus;
	extraFields?: Record<string, unknown>;
	batch?: string;
	batchCounter?: number;
	deliveryType: string;
	readyForDelivery?: boolean;
	customMessage?: string;
	priceCategoryId?: string;
	entryPermissions?: any[][];
	transactionId: string;
	excludedEventIds: string[];
	customerId: string;
	history: any[]; // You can define a more specific type if needed
	claimed?: boolean;
	cartItemId?: string;
	personalized?: boolean;
	addOns?: any[];
	capabilities?: any[];
	returnable?: boolean;
	cancellable?: boolean;
	requiresPersonalization?: boolean;
	requiresExtraFields?: boolean;
	transferable?: boolean;
	upgradeable?: boolean;
	repersonalizationFee?: number;
	pdfEnabled?: boolean;
	appleWalletEnabled?: boolean;
	googleWalletEnabled?: boolean;
	seatingInfo_rowName?: string;
	seatingInfo_seatName?: string;
	seatingInfo_gate?: string;
	seatingInfo_sectionName?: string;
	seatingInfo_groupName?: string | null;
}
