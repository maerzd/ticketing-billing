// Notion API base types
export interface NotionUser {
	object: "user";
	id: string;
}

// Data source types for 2025-09-03 API
export interface DataSource {
	object: "data_source";
	id: string;
	name: string;
	type: "notion_database";
	workspace_id: string;
	notion_database: {
		id: string;
	};
}

export interface DataSourceResponse {
	object: "list";
	results: DataSource[];
	next_cursor: string | null;
	has_more: boolean;
}

export interface NotionParent {
	type: "database_id";
	database_id: string;
}

export interface NotionRichTextContent {
	type: "text";
	text: {
		content: string;
		link: string | null;
	};
	annotations: {
		bold: boolean;
		italic: boolean;
		strikethrough: boolean;
		underline: boolean;
		code: boolean;
		color: string;
	};
	plain_text: string;
	href: string | null;
}

export interface NotionRichTextProperty {
	id: string;
	type: "rich_text";
	rich_text: NotionRichTextContent[];
}

export interface NotionTitleProperty {
	id: string;
	type: "title";
	title: NotionRichTextContent[];
}

export interface NotionEmailProperty {
	id: string;
	type: "email";
	email: string | null;
}

export interface NotionUrlProperty {
	id: string;
	type: "url";
	url: string | null;
}

export interface NotionPhoneProperty {
	id: string;
	type: "phone_number";
	phone_number: string | null;
}

export interface NotionNumberProperty {
	id: string;
	type: "number";
	number: number | null;
}

export interface NotionRelationProperty {
	id: string;
	type: "relation";
	relation: Array<{ id: string }>;
	has_more: boolean;
}

export interface NotionStatusProperty {
	id: string;
	type: "status";
	status: {
		id: string;
		name: string;
		color: string;
	} | null;
}

// Venue-specific property types
export interface VenueProperties {
	venueid: NotionTitleProperty;
	locationName: NotionRichTextProperty;
	locationStreet: NotionRichTextProperty;
	locationCity: NotionRichTextProperty;
	locationPostal: NotionRichTextProperty;
	locationCountry: NotionRichTextProperty;
	description: NotionRichTextProperty;
	email: NotionEmailProperty;
	website: NotionUrlProperty;
	phone: NotionPhoneProperty;
	imagekitUrl: NotionRichTextProperty;
	seoTitle: NotionRichTextProperty;
	seoDescription: NotionRichTextProperty;
	publishStatus: NotionStatusProperty;
}

// Event-specific property types
export interface EventProperties {
	eventid: NotionTitleProperty;
	name: NotionRichTextProperty;
	venue: NotionRelationProperty;
}

// Organizer-specific property types
export interface OrganizerProperties {
	organizerid: NotionTitleProperty;
	name: NotionRichTextProperty;
	website: NotionUrlProperty;
	email: NotionEmailProperty;
	phone: NotionPhoneProperty;
	street: NotionRichTextProperty;
	city: NotionRichTextProperty;
	postal: NotionRichTextProperty;
	country: NotionRichTextProperty;
	taxRate: NotionNumberProperty;
	events: NotionRelationProperty;
}

export interface UserProperties {
	userid: NotionTitleProperty;
	name: NotionRichTextProperty;
	organizers: NotionRelationProperty;
}

// Generic Notion page type
export interface NotionPage<T = Record<string, unknown>> {
	object: "page";
	id: string;
	created_time: string;
	last_edited_time: string;
	created_by: NotionUser;
	last_edited_by: NotionUser;
	cover: null;
	icon: null;
	parent: NotionParent;
	archived: boolean;
	in_trash: boolean;
	properties: T;
	url: string;
	public_url: string | null;
}

// Generic Notion database query response for 2025-09-03 API
export interface NotionDatabaseResponse<T = Record<string, unknown>> {
	object: "list";
	results: NotionPage<T>[];
	next_cursor: string | null;
	has_more: boolean;
	type: "page_or_database";
	page_or_database: Record<string, unknown>;
	developer_survey: string;
	request_id: string;
	data_source?: DataSource; // Added for 2025-09-03 API
}

// Simplified venue types for easier use
export interface VenueData {
	id: string;
	venueid: string;
	locationName: string;
	locationStreet: string;
	locationCity: string;
	locationPostal: string;
	locationCountry: string;
	description: string;
	email: string | null;
	website: string | null;
	phone: string | null;
	imagekitUrl: string;
	seoTitle: string;
	seoDescription: string;
	publishStatus: string;
	createdTime: string;
	lastEditedTime: string;
}

// Simplified event types for easier use
export interface EventData {
	id: string;
	eventid: string;
	name: string;
	venueIds: string[];
	createdTime: string;
	lastEditedTime: string;
}

// Simplified organizer types for easier use
export interface OrganizerData {
	id: string;
	organizerid: string;
	name: string;
	website: string | null;
	email: string | null;
	phone: string | null;
	street: string;
	city: string;
	postal: string;
	country: string;
	taxRate: number | null;
	eventIds: string[];
	createdTime: string;
	lastEditedTime: string;
}

export interface UserData {
	id: string;
	userid: string;
	organizers: string[];
	name?: string;
}

// Type aliases for convenience
export type VenuePage = NotionPage<VenueProperties>;
export type VenueResponse = NotionDatabaseResponse<VenueProperties>;

export type EventPage = NotionPage<EventProperties>;
export type EventResponse = NotionDatabaseResponse<EventProperties>;

export type OrganizerPage = NotionPage<OrganizerProperties>;
export type OrganizerResponse = NotionDatabaseResponse<OrganizerProperties>;

export type UserPage = NotionPage<UserProperties>;
export type UserResponse = NotionDatabaseResponse<UserProperties>;

// Helper function to extract text from rich text property
function extractRichTextContent(
	richText: NotionRichTextContent[] | undefined | null,
): string {
	if (!richText) return "";
	return richText.map((item) => item.plain_text).join("");
}

// Helper function to convert Notion venue page to simplified venue data
export function transformVenuePageToData(page: VenuePage): VenueData {
	return {
		id: page.id,
		venueid: extractRichTextContent(page.properties.venueid.title),
		locationName: extractRichTextContent(
			page.properties.locationName.rich_text,
		),
		locationStreet: extractRichTextContent(
			page.properties.locationStreet.rich_text,
		),
		locationCity: extractRichTextContent(
			page.properties.locationCity.rich_text,
		),
		locationPostal: extractRichTextContent(
			page.properties.locationPostal.rich_text,
		),
		locationCountry: extractRichTextContent(
			page.properties.locationCountry.rich_text,
		),
		description: extractRichTextContent(page.properties.description.rich_text),
		email: page.properties.email?.email || null,
		website: page.properties.website?.url || null,
		phone: page.properties.phone?.phone_number || null,
		imagekitUrl: extractRichTextContent(page.properties.imagekitUrl.rich_text),
		seoTitle: extractRichTextContent(page.properties.seoTitle.rich_text),
		seoDescription: extractRichTextContent(
			page.properties.seoDescription.rich_text,
		),
		publishStatus: page.properties.publishStatus.status?.name || "DRAFT",
		createdTime: page.created_time,
		lastEditedTime: page.last_edited_time,
	};
}

// Helper function to convert Notion event page to simplified event data
export function transformEventPageToData(page: EventPage): EventData {
	return {
		id: page.id,
		eventid: extractRichTextContent(page.properties.eventid.title),
		name: extractRichTextContent(page.properties.name.rich_text),
		venueIds: page.properties.venue.relation.map((rel) => rel.id),
		createdTime: page.created_time,
		lastEditedTime: page.last_edited_time,
	};
}

// Helper function to convert Notion organizer page to simplified organizer data
export function transformOrganizerPageToData(
	page: OrganizerPage,
): OrganizerData {
	return {
		id: page.id,
		organizerid: extractRichTextContent(page.properties.organizerid.title),
		name: extractRichTextContent(page.properties.name.rich_text),
		website: page.properties.website?.url || null,
		email: page.properties.email?.email || null,
		phone: page.properties.phone?.phone_number || null,
		street: extractRichTextContent(page.properties.street?.rich_text),
		city: extractRichTextContent(page.properties.city?.rich_text),
		postal: extractRichTextContent(page.properties.postal?.rich_text),
		country: extractRichTextContent(page.properties.country?.rich_text),
		taxRate: page.properties.taxRate?.number ?? null,
		eventIds: page.properties.events?.relation.map((rel) => rel.id),
		createdTime: page.created_time,
		lastEditedTime: page.last_edited_time,
	};
}

export function transformUserPageToData(page: UserPage): UserData {
	return {
		id: page.id,
		userid: extractRichTextContent(page.properties.userid.title),
		name: extractRichTextContent(page.properties.name?.rich_text),
		organizers: page.properties.organizers.relation.map((rel) => rel.id),
	};
}
