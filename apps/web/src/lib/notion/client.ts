import type {
	NotionDatabaseResponse,
	NotionPage,
	OrganizerData,
	OrganizerPage,
	OrganizerProperties,
	UserData,
	UserPage,
	UserProperties,
} from "./notion-types";
import {
	transformOrganizerPageToData,
	transformUserPageToData,
} from "./notion-types";

// Configuration
const NOTION_CONFIG = {
	API_KEY: process.env.NOTION_API_KEY || "",
	API_VERSION: "2022-06-28",
	BASE_URL: "https://api.notion.com/v1",
	DATABASES: {
		VENUES: "25fda5a0-d946-8033-8c3e-d8db7a10458a",
		EVENTS: "25fda5a0-d946-80bc-aa90-c522e430c805",
		ORGANIZERS: "267da5a0-d946-80c6-8989-e77305b2be7e",
		USERS: "28fda5a0d94680d19ff7ccf620bfaae3",
	},
	DATASOURCES: {
		ORGANIZERS: "28fda5a0d946804cbeb3000bb0cc6c76",
		USERS: "28fda5a0-d946-80fd-bade-000b544a3cf7",
		EVENTS: "294da5a0-d946-8063-9677-000bc763f9ff",
	},
} as const;

// Common headers for Notion API requests
const getNotionHeaders = () => ({
	Authorization: `Bearer ${NOTION_CONFIG.API_KEY}`,
	"Content-Type": "application/json",
	"Notion-Version": NOTION_CONFIG.API_VERSION,
});

// Helper function to get a single page by ID
async function getNotionPage<T>(
	pageId: string,
	options: {
		cache?: RequestCache;
		revalidate?: false | number;
		tags?: string[];
	} = {},
): Promise<NotionPage<T>> {
	const { cache = "force-cache", revalidate = false, tags = [] } = options;

	const url = `${NOTION_CONFIG.BASE_URL}/pages/${pageId}`;
	const response = await fetch(url, {
		headers: getNotionHeaders(),
		cache,
		next: { revalidate, tags },
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error(
			`Notion API error: ${response.statusText} on ${url}, message: ${errorText}`,
		);
		throw new Error(`Notion API error: ${response.statusText}`);
	}

	return response.json();
}

// Helper function to query a data source
async function queryNotionDataSource<T>(
	dataSourceId: string,
	filter: Record<string, unknown>,
	options: {
		cache?: RequestCache;
		revalidate?: false | number;
		tags?: string[];
		page_size?: number;
	} = {},
): Promise<NotionPage<T> | null> {
	const {
		cache = "force-cache",
		revalidate = false,
		tags = [],
		page_size = 1,
	} = options;

	const url = `${NOTION_CONFIG.BASE_URL}/databases/${dataSourceId}/query`;

	const body = {
		filter,
		page_size,
	};

	const response = await fetch(url, {
		method: "POST",
		headers: getNotionHeaders(),
		body: JSON.stringify(body),
		cache,
		next: { revalidate, tags },
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error(
			`Notion API error: ${response.statusText} on ${url}, message: ${errorText}`,
		);
		throw new Error(`Notion API error: ${response.statusText}`);
	}

	const data: NotionDatabaseResponse<T> = await response.json();
	return data.results?.[0] ?? null;
}

/**
 * Get organizer by page ID
 */
export async function getOrganizer(
	organizerId: string | undefined,
	userId: string | undefined,
): Promise<OrganizerData | null> {
	if (!organizerId || !userId) return null;

	try {
		const page = await getNotionPage<OrganizerProperties>(organizerId, {
			tags: [`user-${userId}`],
		});
		return transformOrganizerPageToData(page as unknown as OrganizerPage);
	} catch (error) {
		console.error(error, { extra: { organizerId, userId } });
		return null;
	}
}

export async function queryOrganizer(
	organizerId: string | undefined,
	userId: string | undefined,
): Promise<OrganizerData | null> {
	if (!organizerId || !userId) return null;

	const filter = {
		property: "organizerid",
		title: {
			equals: organizerId,
		},
	};

	const page = await queryNotionDataSource<OrganizerProperties>(
		NOTION_CONFIG.DATABASES.ORGANIZERS,
		filter,
		{ tags: [`user-${userId}`] },
	);
	if (!page) return null;
	return transformOrganizerPageToData(page as unknown as OrganizerPage);
}

/**
 * Get all organizers from Notion database
 */
export async function getAllOrganizers(): Promise<OrganizerData[]> {
	try {
		const url = `${NOTION_CONFIG.BASE_URL}/databases/${NOTION_CONFIG.DATABASES.ORGANIZERS}/query`;
		const allResults: NotionPage<OrganizerProperties>[] = [];
		let hasMore = true;
		let nextCursor: string | null | undefined;
		while (hasMore) {
			const body: Record<string, unknown> = {
				page_size: 100,
			};
			if (nextCursor) {
				body.start_cursor = nextCursor;
			}
			const response = await fetch(url, {
				method: "POST",
				headers: getNotionHeaders(),
				body: JSON.stringify(body),
				cache: "no-store",
			});
			if (!response.ok) {
				const errorText = await response.text();
				console.error(
					`Notion API error: ${response.statusText}, message: ${errorText}`,
				);
				throw new Error(`Notion API error: ${response.statusText}`);
			}
			const data: NotionDatabaseResponse<OrganizerProperties> =
				await response.json();
			if (Array.isArray(data.results)) {
				allResults.push(...data.results);
			}
			if (data.has_more && data.next_cursor) {
				hasMore = true;
				nextCursor = data.next_cursor;
			} else {
				hasMore = false;
				nextCursor = null;
			}
		}
		return allResults.map((page) =>
			transformOrganizerPageToData(page as unknown as OrganizerPage),
		);
	} catch (error) {
		console.error(error);
		return [];
	}
}

/**
 * Create a new user in Notion USERS database
 */
export async function createUserInNotion(
	userid: string,
	organizerIds: string[],
	name?: string,
): Promise<UserData | null> {
	try {
		const url = `${NOTION_CONFIG.BASE_URL}/pages`;
		const body = {
			parent: {
				database_id: NOTION_CONFIG.DATABASES.USERS,
			},
			properties: {
				userid: {
					title: [
						{
							type: "text" as const,
							text: {
								content: userid,
							},
						},
					],
				},
				...(name && {
					name: {
						rich_text: [
							{
								type: "text" as const,
								text: {
									content: name,
								},
							},
						],
					},
				}),
				organizers: {
					relation: organizerIds.map((id) => ({ id })),
				},
			},
		};

		const response = await fetch(url, {
			method: "POST",
			headers: getNotionHeaders(),
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`Notion API error: ${response.statusText}, message: ${errorText}`,
			);
			throw new Error(`Notion API error: ${response.statusText}`);
		}

		const page = (await response.json()) as UserPage;
		return transformUserPageToData(page);
	} catch (error) {
		console.error(error, { extra: { userid, organizerIds } });
		return null;
	}
}

/**
 * Query user by userId from the USERS data source
 */
export async function queryUser(
	userId: string | undefined,
): Promise<UserData | null> {
	if (!userId) return null;

	try {
		const filter = {
			property: "userid",
			title: {
				equals: userId,
			},
		};
		const page = await queryNotionDataSource<UserProperties>(
			NOTION_CONFIG.DATABASES.USERS,
			filter,
			{
				tags: [`user-${userId}`],
			},
		);
		if (!page) return null;
		return transformUserPageToData(page as unknown as UserPage);
	} catch (error) {
		console.error(error, { extra: { userId } });
		return null;
	}
}
