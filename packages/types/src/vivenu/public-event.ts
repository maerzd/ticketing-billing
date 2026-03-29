import type { EventType } from "./public-listing-event";

export interface Gallery {
	_id: string;
	title: string;
	description: string;
	copyright: string;
	index: number;
	image: string;
}

export interface Location {
	locationName?: string;
	locationStreet?: string;
	locationCity?: string;
	locationPostal?: string;
	locationCountry?: string;
	geoCode?: {
		_id: string;
		lat: number;
		lng: number;
	};
}

export interface PublicEvent {
	_id: string;
	sellerId?: string;
	meta?: Record<string, unknown>;
	eventType?: EventType;
	name: string;
	start: string; // ISO 8601 date string
	end: string; // ISO 8601 date string
	url?: string;
	slogan?: string;
	description?: string;
	image?: string;
	pageStyle?: "white" | "dark" | string; // add other styles as needed
	styleOptions?: {
		headerStyle?: string;
		hideLocationMap?: boolean;
		categoryAlignment?: number;
		showAvailabilityIndicator?: boolean;
		availabilityIndicatorThresholds?: number[];
	};
	video?: {
		youtubeID?: string;
	};
	gallery?: Array<Gallery>;
	checkinInformation?: {
		_id?: string;
		checkinStarts?: string; // ISO 8601 date string
	};
	accentColor?: string; // e.g., "#006DCC"
	tickets?: Array<{
		_id?: string;
		name?: string;
		description?: string;
		image?: string;
		color?: string;
		price?: number;
		amount?: number;
		active?: boolean;
		posActive?: boolean;
		categoryRef?: string;
		ignoredForStartingPrice?: boolean;
		conditionalAvailability?: boolean;
		ticketBackground?: string;
		rules?: Array<{
			_id?: string;
			ticketGroup?: string;
			min?: number;
			max?: number;
		}>;
		requiresPersonalization?: boolean;
		requiresPersonalizationMode?: "ENABLED" | "DISABLED" | null;
		requiresExtraFields?: boolean;
		requiresExtraFieldsMode?: "ENABLED" | "DISABLED" | null;
		repersonalizationFee?: number;
		sortingKey?: number;
		enableHardTicketOption?: boolean;
		forceHardTicketOption?: boolean;
		maxAmountPerOrder?: number;
		minAmountPerOrder?: number;
		minAmountPerOrderRule?: number;
		taxRate?: number;
		styleOptions?: Record<string, unknown>;
		priceCategoryId?: string;
		entryPermissions?: string[];
		ignoreForMaxAmounts?: boolean;
		expirationSettings?: Record<string, unknown>;
		barcodePrefix?: string;
		salesStart?: {
			unit?: "hours" | "days" | string;
			offset?: number;
		};
		salesEnd?: {
			unit?: "hours" | "days" | string;
			offset?: number;
		};
		transferSettings?: {
			expiresAfter?: {
				unit: "hours" | "days" | "months" | "years";
				offset: number;
			};
			allowedUntil?: {
				unit: "hours" | "days" | "months" | "years";
				offset: number;
			};
		};
		scanSettings?: {
			feedback?: string;
		};
		meta?: Record<string, unknown>;
	}>;
	ticketExtraFields?: Array<{
		_id?: string;
		name?: string;
		description?: string;
		required?: boolean;
		deleted?: boolean;
		type?: "text" | "number" | string;
		options?: string[];
		onlyForCertainTicketTypes?: boolean;
		allowedTicketTypes?: string[];
		printable?: boolean;
		conditions?: Array<{
			_id?: string;
			baseSlug?: string;
			// biome-ignore lint/suspicious/noExplicitAny: external code from vivenu
			value?: any[];
			operator?: string;
		}>;
	}>;
	ticketDesign?: {
		_id?: string;
		useCustomDesign?: boolean;
		customDesignURL?: string | null;
		footerDesignURL?: string | null;
		disclaimer?: string;
		infoColor?: string;
		showTimeRange?: boolean;
		hideDates?: boolean;
		hideTimes?: boolean;
	};
	extraFields?: Array<{
		_id?: string;
		name?: string;
		description?: string;
		required?: boolean;
		deleted?: boolean;
		type?: "text" | "number" | string;
		options?: string[];
		onlyForCertainTicketTypes?: boolean;
		allowedTicketTypes?: string[];
		printable?: boolean;
		conditions?: Array<{
			_id?: string;
			baseSlug?: string;
			value?: string[];
			operator?: string;
		}>;
	}>;
	showCountdown?: boolean;
	showOtherEvents?: boolean;
	hardTicketSettings?: {
		_id?: string;
		enabled?: boolean;
		fulfillmentType?: string;
		printingMethod?: string;
		hardTicketOuterCharge?: number;
		hardTicketInnerCharge?: number | null;
		hardTicketPreviewURL?: string;
		promotionName?: string;
		promotionText?: string;
		requiredDays?: number;
	};
	tracking?: {
		facebookPixel?: {
			active?: boolean;
			pixelId?: string;
		};
		tagging?: {
			enabled?: boolean;
			tags?: string[];
		};
	};
	seoSettings?: {
		_id?: string;
		tags?: string[];
		noIndex?: boolean;
		title?: string;
		description?: string;
	};
	soldOutFallback?: {
		_id?: string;
		soldOutFallbackType?: string;
		soldOutFallbackLink?: string;
	};
	reservationSettings?: {
		option?: "noReservations" | "reservationsOnly" | string;
	};
	customTextConfig?: {
		_id?: string;
		buyTicketsCTA?: string;
	};
	timezone?: string;
	ticketSettings?: {
		cancellationStrategy?: string;
		transferSettings?: {
			mode?: "ALLOWED" | "DISABLED";
			expiresAfter?: {
				unit: "minutes" | "hours" | "days" | "weeks" | "months" | "years";
				offset: number;
				target?: string;
			};
			retransferMode?: "ALLOWED" | "DISABLED";
			allowedUntil?: {
				unit: "minutes" | "hours" | "days" | "weeks" | "months" | "years";
				offset: number;
				target?: string;
			};
			hardTicketsMode?: "ALLOWED" | "DISABLED";
		};
		upgradeSettings?: {
			enabled?: "ENABLED" | "DISABLED";
			underShopMapping?: [
				{
					type: string;
					tag: string;
					underShopId: string;
				},
			];
		};
		seasonCardValueStrategy?: string;
	};
	rootId?: string;
	customSettings?: {
		hideTicketsInTransactionPage?: boolean;
		dontSendTicketMail?: boolean;
		dontSendBookingConfirmationMail?: boolean;
		customMailHeaderImage?: string;
		customTransactionCompletionText?: string;
		showStartDate?: boolean;
		showStartTime?: boolean;
		showEndDate?: boolean;
		showEndTime?: boolean;
		showTimeRangeInTicket?: boolean;
		customCheckoutCSS?: string;
		useCustomCheckoutBrand?: boolean;
		customCheckoutBrand?: string;
		hideLogoInCheckout?: boolean;
		customEventPageHTML?: string;
		customEventPageCSS?: string;
		customConfirmationPage?: string;
		hideSeatmapInCheckout?: boolean;
		dontSendBookingConfirmationSMS?: boolean;
	};
	upsellSettings?: {
		_id?: string;
		active?: boolean;
		productStream?: string;
		headerImage?: string;
		crossSells?: {
			eventIds?: string[];
		};
	};
	category?: string;
	subCategory?: string;
	showTimeRangeInTicket?: boolean;
	showTimeRangeInListing?: boolean;
	showStartDate?: boolean;
	showStartTime?: boolean;
	showEndDate?: boolean;
	showEndTime?: boolean;
	accountSettings?: {
		_id?: string;
		enforceAccounts?: boolean;
		enforceAuthentication?: "DISABLED" | "ENABLED";
	};
	location?: Location;
}
