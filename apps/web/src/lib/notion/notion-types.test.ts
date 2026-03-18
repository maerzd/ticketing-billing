import { describe, expect, it } from "vitest";
import {
	type EventPage,
	type NotionUser,
	type OrganizerPage,
	type OrganizerProperties,
	transformEventPageToData,
	transformOrganizerPageToData,
	transformVenuePageToData,
	type VenuePage,
	type VenueProperties,
} from "./notion-types";

// Helper to create a NotionRichTextContent array
function richText(content: string): any[] {
	return [
		{
			type: "text",
			text: { content, link: null },
			annotations: {
				bold: false,
				italic: false,
				strikethrough: false,
				underline: false,
				code: false,
				color: "default",
			},
			plain_text: content,
			href: null,
		},
	];
}

const baseUser: NotionUser = { object: "user", id: "user-1" };

function makeVenuePage(overrides: Partial<VenueProperties> = {}): VenuePage {
	const now = new Date().toISOString();
	return {
		object: "page",
		id: "venue-page-1",
		created_time: now,
		last_edited_time: now,
		created_by: baseUser,
		last_edited_by: baseUser,
		cover: null,
		icon: null,
		parent: { type: "database_id", database_id: "db-1" },
		archived: false,
		in_trash: false,
		url: "https://notion.so/page",
		public_url: null,
		properties: {
			venueid: { id: "1", type: "title", title: richText("VENUE123") },
			locationName: {
				id: "2",
				type: "rich_text",
				rich_text: richText("Venue Name"),
			},
			locationStreet: {
				id: "3",
				type: "rich_text",
				rich_text: richText("123 Main St"),
			},
			locationCity: {
				id: "4",
				type: "rich_text",
				rich_text: richText("Berlin"),
			},
			locationPostal: {
				id: "5",
				type: "rich_text",
				rich_text: richText("10115"),
			},
			locationCountry: {
				id: "6",
				type: "rich_text",
				rich_text: richText("Germany"),
			},
			description: {
				id: "7",
				type: "rich_text",
				rich_text: richText("A great venue."),
			},
			email: { id: "8", type: "email", email: "info@venue.com" },
			website: { id: "9", type: "url", url: "https://venue.com" },
			phone: { id: "10", type: "phone_number", phone_number: "+49123456789" },
			imagekitUrl: {
				id: "11",
				type: "rich_text",
				rich_text: richText("https://img.url"),
			},
			seoTitle: {
				id: "12",
				type: "rich_text",
				rich_text: richText("SEO Title"),
			},
			seoDescription: {
				id: "13",
				type: "rich_text",
				rich_text: richText("SEO Desc"),
			},
			publishStatus: {
				id: "14",
				type: "status",
				status: { id: "published", name: "PUBLISHED", color: "green" },
			},
			...overrides,
		},
	};
}

describe("transformVenuePageToData", () => {
	it("transforms a full VenuePage to VenueData", () => {
		const page = makeVenuePage();
		const data = transformVenuePageToData(page);

		expect(data).toEqual({
			id: "venue-page-1",
			venueid: "VENUE123",
			locationName: "Venue Name",
			locationStreet: "123 Main St",
			locationCity: "Berlin",
			locationPostal: "10115",
			locationCountry: "Germany",
			description: "A great venue.",
			email: "info@venue.com",
			website: "https://venue.com",
			phone: "+49123456789",
			imagekitUrl: "https://img.url",
			seoTitle: "SEO Title",
			seoDescription: "SEO Desc",
			publishStatus: "PUBLISHED",
			createdTime: page.created_time,
			lastEditedTime: page.last_edited_time,
		});
	});

	it("handles missing optional fields (email, website, phone)", () => {
		const page = makeVenuePage({
			email: { id: "8", type: "email", email: null },
			website: { id: "9", type: "url", url: null },
			phone: { id: "10", type: "phone_number", phone_number: null },
		});
		const data = transformVenuePageToData(page);

		expect(data.email).toBeNull();
		expect(data.website).toBeNull();
		expect(data.phone).toBeNull();
	});

	it("returns 'DRAFT' if publishStatus.status is null", () => {
		const page = makeVenuePage({
			publishStatus: { id: "14", type: "status", status: null },
		});
		const data = transformVenuePageToData(page);

		expect(data.publishStatus).toBe("DRAFT");
	});

	it("returns empty string for missing rich text fields", () => {
		const page = makeVenuePage({
			locationName: { id: "2", type: "rich_text", rich_text: [] },
			description: { id: "7", type: "rich_text", rich_text: null as any },
		});
		const data = transformVenuePageToData(page);

		expect(data.locationName).toBe("");
		expect(data.description).toBe("");
	});

	// Helper to create a NotionRichTextContent array
	function richText(content: string): any[] {
		return [
			{
				type: "text",
				text: { content, link: null },
				annotations: {
					bold: false,
					italic: false,
					strikethrough: false,
					underline: false,
					code: false,
					color: "default",
				},
				plain_text: content,
				href: null,
			},
		];
	}

	const baseUser: NotionUser = { object: "user", id: "user-1" };

	function makeEventPage(
		overrides: Partial<EventPage["properties"]> = {},
	): EventPage {
		const now = new Date().toISOString();
		return {
			object: "page",
			id: "event-page-1",
			created_time: now,
			last_edited_time: now,
			created_by: baseUser,
			last_edited_by: baseUser,
			cover: null,
			icon: null,
			parent: { type: "database_id", database_id: "db-2" },
			archived: false,
			in_trash: false,
			url: "https://notion.so/event-page",
			public_url: null,
			properties: {
				eventid: { id: "1", type: "title", title: richText("EVENT123") },
				name: { id: "2", type: "rich_text", rich_text: richText("Event Name") },
				venue: {
					id: "3",
					type: "relation",
					relation: [{ id: "venue-1" }, { id: "venue-2" }],
					has_more: false,
				},
				...overrides,
			},
		};
	}

	describe("transformEventPageToData", () => {
		it("transforms a full EventPage to EventData", () => {
			const page = makeEventPage();
			const data = transformEventPageToData(page);

			expect(data).toEqual({
				id: "event-page-1",
				eventid: "EVENT123",
				name: "Event Name",
				venueIds: ["venue-1", "venue-2"],
				createdTime: page.created_time,
				lastEditedTime: page.last_edited_time,
			});
		});

		it("handles empty venue relation array", () => {
			const page = makeEventPage({
				venue: {
					id: "3",
					type: "relation",
					relation: [],
					has_more: false,
				},
			});
			const data = transformEventPageToData(page);

			expect(data.venueIds).toEqual([]);
		});

		it("returns empty string for missing rich text fields", () => {
			const page = makeEventPage({
				eventid: { id: "1", type: "title", title: [] },
				name: { id: "2", type: "rich_text", rich_text: [] },
			});
			const data = transformEventPageToData(page);

			expect(data.eventid).toBe("");
			expect(data.name).toBe("");
		});

		// --- Organizer tests ---

		function makeOrganizerPage(
			overrides: Partial<OrganizerProperties> = {},
		): OrganizerPage {
			const now = new Date().toISOString();
			return {
				object: "page",
				id: "organizer-page-1",
				created_time: now,
				last_edited_time: now,
				created_by: baseUser,
				last_edited_by: baseUser,
				cover: null,
				icon: null,
				parent: { type: "database_id", database_id: "db-3" },
				archived: false,
				in_trash: false,
				url: "https://notion.so/organizer-page",
				public_url: null,
				properties: {
					organizerid: { id: "1", type: "title", title: richText("ORG123") },
					name: {
						id: "2",
						type: "rich_text",
						rich_text: richText("Veranstalter Name"),
					},
					website: { id: "3", type: "url", url: "https://org.com" },
					email: { id: "4", type: "email", email: "contact@org.com" },
					phone: {
						id: "5",
						type: "phone_number",
						phone_number: "+49123456789",
					},
					street: {
						id: "6",
						type: "rich_text",
						rich_text: richText("Street 1"),
					},
					city: { id: "7", type: "rich_text", rich_text: richText("Berlin") },
					postal: { id: "8", type: "rich_text", rich_text: richText("10115") },
					country: {
						id: "9",
						type: "rich_text",
						rich_text: richText("Germany"),
					},
					events: {
						id: "10",
						type: "relation",
						relation: [{ id: "event-1" }, { id: "event-2" }],
						has_more: false,
					},
					...overrides,
				},
			};
		}

		describe("transformOrganizerPageToData", () => {
			it("transforms a full OrganizerPage to OrganizerData", () => {
				const page = makeOrganizerPage();
				const data = transformOrganizerPageToData(page);

				expect(data).toEqual({
					id: "organizer-page-1",
					organizerid: "ORG123",
					name: "Veranstalter Name",
					website: "https://org.com",
					email: "contact@org.com",
					phone: "+49123456789",
					street: "Street 1",
					city: "Berlin",
					postal: "10115",
					country: "Germany",
					eventIds: ["event-1", "event-2"],
					createdTime: page.created_time,
					lastEditedTime: page.last_edited_time,
				});
			});

			it("handles missing optional fields (website, email, phone)", () => {
				const page = makeOrganizerPage({
					website: { id: "3", type: "url", url: null },
					email: { id: "4", type: "email", email: null },
					phone: { id: "5", type: "phone_number", phone_number: null },
				});
				const data = transformOrganizerPageToData(page);

				expect(data.website).toBeNull();
				expect(data.email).toBeNull();
				expect(data.phone).toBeNull();
			});

			it("returns empty string for missing rich text fields", () => {
				const page = makeOrganizerPage({
					organizerid: { id: "1", type: "title", title: [] },
					name: { id: "2", type: "rich_text", rich_text: [] },
					street: { id: "6", type: "rich_text", rich_text: [] },
					city: { id: "7", type: "rich_text", rich_text: [] },
					postal: { id: "8", type: "rich_text", rich_text: [] },
					country: { id: "9", type: "rich_text", rich_text: [] },
				});
				const data = transformOrganizerPageToData(page);

				expect(data.organizerid).toBe("");
				expect(data.name).toBe("");
				expect(data.street).toBe("");
				expect(data.city).toBe("");
				expect(data.postal).toBe("");
				expect(data.country).toBe("");
			});

			it("handles empty events relation array", () => {
				const page = makeOrganizerPage({
					events: {
						id: "10",
						type: "relation",
						relation: [],
						has_more: false,
					},
				});
				const data = transformOrganizerPageToData(page);

				expect(data.eventIds).toEqual([]);
			});

			it("handles null/undefined rich text fields gracefully", () => {
				const page = makeOrganizerPage({
					street: { id: "6", type: "rich_text", rich_text: null as any },
					city: { id: "7", type: "rich_text", rich_text: undefined as any },
				});
				const data = transformOrganizerPageToData(page);

				expect(data.street).toBe("");
				expect(data.city).toBe("");
			});
		});
	});
});
