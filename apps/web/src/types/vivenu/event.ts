export interface VivenuEvent {
	_id: string;
	sellerId: string;
	name: string;
	slogan: string;
	description: string;
	locationName: string;
	locationStreet: string;
	locationCity: string;
	locationPostal: string;
	locationCountry: string;
	image: string;
	ticketFooter: string;
	ticketBackground: string;
	ticketShopHeader: string;
	groups: Group[];
	discountGroups: DiscountGroup[];
	cartAutomationRules: CartAutomationRule[];
	posDiscounts: PosDiscount[];
	categories: Category[];
	tickets: Ticket[];
	createdAt: string;
	updatedAt: string;
	start: string;
	end: string;
	sellStart: string;
	sellEnd: string;
	maxAmount: number;
	maxAmountPerOrder: number;
	maxAmountPerCustomer: number;
	maxTransactionsPerCustomer: number;
	minAmountPerOrder: number;
	customerTags: string[];
	customerSegments: string[];
	showCountdown: boolean;
	hideInListing: boolean;
	visibleAfter: string;
	customSettings: Record<string, unknown>;
	extraFields: ExtraField[];
	ticketExtraFields: ExtraField[];
	accentColor: string;
	pageStyle: string;
	showOtherEvents: boolean;
	underShops: UnderShop[];
	seating: Seating;
	customTextConfig: CustomTextConfig;
	eventType: string;
	childEvents: string[];
	url: string;
	tags: string[];
	seoSettings: SeoSettings;
	extraInformation: ExtraInformation;
	customCharges: CustomCharges;
	gallery: GalleryItem[];
	video: Video;
	soldOutFallback: SoldOutFallback;
	ticketDesign: TicketDesign;
	checkinInformation: CheckinInformation;
	tracking: Tracking;
	hardTicketSettings: HardTicketSettings;
	dataRequestSettings: DataRequestSettings;
	styleOptions: StyleOptions;
	geoCode: GeoCode;
	accountSettings: AccountSettings;
	reservationSettings: ReservationSettings;
	upsellSettings: UpsellSettings;
	repetitionSettings: RepetitionSetting[];
	rootId: string;
	daySchemes: DayScheme[];
	daySchemeId: string;
	ticketSettings: Record<string, unknown>;
	accessListMapping: AccessListMapping[];
	deliverySettings: DeliverySettings;
	meta: Record<string, unknown>;
	timezone: string;
	salesChannelGroupSettings: SalesChannelGroupSetting[];
	paymentSettings: PaymentSettings;
	timeSlots: TimeSlot[];
	useTimeSlots: boolean;
	attributes: {
		venueid?: string;
		organizerid?: string;
	};
}

export interface Group {
	_id: string;
	name: string;
	tickets: string[];
}

export interface DiscountGroup {
	_id: string;
	name: string;
	rules: DiscountRule[];
	discountType: string;
	value: number;
}

export interface DiscountRule {
	_id: string;
	group: string;
	type: string;
	min: number;
	max: number;
}

export interface CartAutomationRule {
	_id: string;
	name: string;
	triggerType: string;
	triggerTargetGroup: string;
	thenType: string;
	thenTargets: ThenTarget[];
}

export interface ThenTarget {
	_id: string;
	thenTargetGroup: string;
	thenTargetMin: number;
	thenTargetMax: number;
}

export interface PosDiscount {
	_id: string;
	name: string;
	discountType: string;
	value: number;
}

export interface Category {
	_id: string;
	name: string;
	description: string;
	seatingReference: string;
	ref: string;
	amount: number;
	recommendedTicket: string;
	maxAmountPerOrder: number;
	listWithoutSeats: boolean;
}

export interface Ticket {
	_id: string;
	name: string;
	description: string;
	image: string;
	color: string;
	price: number;
	amount: number;
	active: boolean;
	posActive: boolean;
	categoryRef: string;
	ignoredForStartingPrice: boolean;
	conditionalAvailability: boolean;
	ticketBackground: string;
	rules: TicketRule[];
	requiresPersonalization: boolean;
	requiresPersonalizationMode: string;
	requiresExtraFields: boolean;
	requiresExtraFieldsMode: string;
	repersonalizationFee: number;
	sortingKey: number;
	enableHardTicketOption: boolean;
	forceHardTicketOption: boolean;
	maxAmountPerOrder: number;
	minAmountPerOrder: number;
	minAmountPerOrderRule: number;
	taxRate: number;
	styleOptions: Record<string, unknown>;
	priceCategoryId: string;
	entryPermissions: string[];
	ignoreForMaxAmounts: boolean;
	expirationSettings: Record<string, unknown>;
	barcodePrefix: string;
	salesStart: SalesTime;
	salesEnd: SalesTime;
	transferSettings: Record<string, unknown>;
	scanSettings: ScanSettings;
	deliverySettings: DeliverySettings;
	meta: Record<string, unknown>;
}

export interface TicketRule {
	_id: string;
	ticketGroup: string;
	min: number;
	max: number;
}

export interface SalesTime {
	target: string;
	unit: string;
	offset: number;
}

export interface ScanSettings {
	feedback: string;
	allowedScanCount: number;
}

export interface DeliverySettings {
	wallet?: {
		enabled: string;
		nfc?: string;
		seasonCardShowNextEvent?: boolean;
	};
	pdf?: {
		enabled: string;
	};
}

export interface ExtraField {
	_id: string;
	name: string;
	description: string;
	required: boolean;
	collectInCheckout: boolean;
	deleted: boolean;
	type: string;
	options: string[];
	onlyForCertainTicketTypes: boolean;
	allowedTicketTypes: string[];
	printable: boolean;
	conditions: Condition[];
}

export interface Condition {
	_id: string;
	baseSlug: string;
	value: unknown[];
	operator: string;
}

export interface UnderShop {
	_id: string;
	name: string;
	active: boolean;
	tickets: UnderShopTicket[];
	categories: UnderShopCategory[];
	timeSlots: UnderShopTimeSlot[];
	sellStart: string;
	sellEnd: string;
	maxAmount: number;
	maxAmountPerOrder: number;
	minAmountPerOrder: number;
	maxTransactionsPerCustomer: number;
	maxAmountPerCustomer: number;
	ticketShopHeaderText: string;
	customCharges: Record<string, unknown>;
	seatingContingents: string[];
	availabilityMode: string;
	bestAvailableSeatingConfiguration: BestAvailableSeatingConfiguration;
	reservationSettings: ReservationSettings;
	accountSettings: AccountSettings;
	customerTags: string[];
	customerSegments: string[];
	allowMassDownload: boolean;
	inventoryStrategy: string;
	extraFields: ExtraField[];
	salesChannelGroupSettings: SalesChannelGroupSetting[];
	paymentSettings: PaymentSettings;
	unlockMode: string;
}

export interface UnderShopTicket {
	_id: string;
	baseTicket: string;
	name: string;
	description: string;
	price: number;
	amount: number;
	active: boolean;
}

export interface UnderShopCategory {
	_id: string;
	baseCategoryId: string;
	amount: number;
}

export interface UnderShopTimeSlot {
	_id: string;
	baseTimeSlotId: string;
	amount: number;
	enabled: string;
}

export interface BestAvailableSeatingConfiguration {
	enabled: boolean;
	enforced: boolean;
	allowMassBooking?: boolean;
}

export interface ReservationSettings {
	option: string;
}

export interface AccountSettings {
	_id: string;
	enforceAccounts: boolean;
	enforceAuthentication: string;
}

export interface SalesChannelGroupSetting {
	salesChannelGroupId: string;
	enabled: boolean;
}

export interface PaymentSettings {
	paymentStrategyId: string;
}

export interface Seating {
	_id: string;
	active: boolean;
	eventKey: string;
	eventId: string;
	seatMapId: string;
	revisionId: string;
	orphanConfiguration: OrphanConfiguration;
	contingents: string[];
	availabilityMode: string;
	bestAvailableSeatingConfiguration: BestAvailableSeatingConfiguration;
}

export interface OrphanConfiguration {
	_id: string;
	minSeatDistance: number;
	edgeSeatsOrphaning: boolean;
}

export interface CustomTextConfig {
	_id: string;
	buyTicketsCTA: string;
}

export interface SeoSettings {
	_id: string;
	tags: string[];
	noIndex: boolean;
	title: string;
	description: string;
}

export interface ExtraInformation {
	_id: string;
	type: string;
	category: string;
	subCategory: string;
}

export interface CustomCharges {
	_id: string;
	outerChargeVar: number;
	innerChargeVar: number;
	outerChargeFix: number;
	innerChargeFix: number;
	posOuterChargeFix: number;
	posOuterChargeVar: number;
	cartOuterChargeFix: number;
}

export interface GalleryItem {
	_id: string;
	title: string;
	description: string;
	copyright: string;
	index: number;
	image: string;
}

export interface Video {
	youtubeID: string;
}

export interface SoldOutFallback {
	_id: string;
	soldOutFallbackType: string;
	soldOutFallbackLink: string;
}

export interface TicketDesign {
	_id: string;
	useCustomDesign: boolean;
	customDesignURL: string;
	footerDesignURL: string;
	disclaimer: string;
	infoColor: string;
	showTimeRange: boolean;
	hideDates: boolean;
	hideTimes: boolean;
}

export interface CheckinInformation {
	_id: string;
	checkinStarts: string;
}

export interface Tracking {
	facebookPixel: FacebookPixel;
	tagging: Tagging;
}

export interface FacebookPixel {
	active: boolean;
	pixelId: string;
}

export interface Tagging {
	enabled: boolean;
	tags: string[];
}

export interface HardTicketSettings {
	_id: string;
	enabled: boolean;
	fulfillmentType: string;
	printingMethod: string;
	hardTicketOuterCharge: number;
	hardTicketInnerCharge: number;
	hardTicketPreviewURL: string;
	promotionName: string;
	promotionText: string;
	requiredDays: number;
}

export interface DataRequestSettings {
	requiresPersonalization: boolean;
	requiresExtraFields: boolean;
	repersonalization: boolean;
	posPersonalization: string;
}

export interface StyleOptions {
	headerStyle: string;
	hideLocationMap: boolean;
	hideLocationAddress: boolean;
	categoryAlignment: number;
	showAvailabilityIndicator: boolean;
	availabilityIndicatorThresholds: number[];
}

export interface GeoCode {
	_id: string;
	lat: number;
	lng: number;
}

export interface UpsellSettings {
	_id: string;
	active: boolean;
	productStream: string;
	headerImage: string;
	crossSells: CrossSells;
}

export interface CrossSells {
	eventIds: string[];
}

export interface RepetitionSetting {
	every: number;
	unit: string;
	repeatsOn: string[];
	from: string;
	to: string;
}

export interface DayScheme {
	_id: string;
	name: string;
	color: string;
	offers: Record<string, unknown>;
}

export interface AccessListMapping {
	listId: string;
	ticketTypeId: string;
}

export interface TimeSlot {
	_id: string;
	startTime: {
		hour: number;
		minute: number;
	};
	refs: TimeSlotRef[];
	amount: number;
}

export interface TimeSlotRef {
	refType: string;
	categoryRef: string;
}
