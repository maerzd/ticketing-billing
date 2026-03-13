import { VIVENU_API_KEY } from "@/lib/constants";

// Helper function for paginated API calls
export async function fetchPaginated<T>(
	url: string,
	token: string,
	options: {
		top?: number;
		skip?: number;
		fetchAll?: boolean;
		maxItems?: number;
		additionalParams?: Record<string, string>;
	} = {},
): Promise<{
	rows: T[];
	total?: number;
	hasMore: boolean;
	nextToken?: string;
}> {
	const {
		top = 25,
		skip = 0,
		fetchAll = false,
		maxItems = 10000,
		additionalParams = {},
	} = options;

	if (!fetchAll) {
		// Single page fetch
		const params = new URLSearchParams({
			top: Math.min(top, 25).toString(),
			skip: skip.toString(),
			...additionalParams,
		});

		const response = await fetch(`${url}?${params.toString()}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"x-api-key": VIVENU_API_KEY || "",
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.statusText}`);
		}

		const data = await response.json();
		const items = data.rows || [];

		return {
			rows: items,
			total: data.total,
			hasMore: items.length === Math.min(top, 25),
			nextToken:
				items.length === Math.min(top, 25)
					? (skip + Math.min(top, 25)).toString()
					: undefined,
		};
	}

	// Fetch all items with pagination
	const allItems: T[] = [];
	let currentSkip = skip;
	let hasMore = true;

	while (hasMore && allItems.length < maxItems) {
		const params = new URLSearchParams({
			top: "25",
			skip: currentSkip.toString(),
			...additionalParams,
		});

		const response = await fetch(`${url}?${params.toString()}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"x-api-key": VIVENU_API_KEY || "",
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.statusText}`);
		}

		const data = await response.json();
		const items = data.rows || [];

		allItems.push(...items);

		hasMore = items.length === 25;
		currentSkip += 25;
	}

	return {
		rows: allItems,
		total: allItems.length,
		hasMore: false,
	};
}
