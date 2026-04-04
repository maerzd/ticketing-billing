import {
	NEXT_PUBLIC_VIVENU_HUBBLE_URL,
	VIVENU_API_KEY,
	VIVENU_API_URL,
} from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { fetchPaginated } from "./pagination-helper";

export interface VivenuClientConfig {
	accessToken: string;
}

export interface PaginatedRequestOptions {
	top?: number;
	skip?: number;
	fetchAll?: boolean;
	maxItems?: number;
	additionalParams?: Record<string, string>;
}

export class VivenuClient {
	private readonly accessToken: string;
	private readonly apiBase: string;
	private readonly hubbleBase: string;

	constructor(config: VivenuClientConfig) {
		if (!VIVENU_API_URL) {
			throw new AppError("Vivenu API URL is not configured", 500);
		}

		if (!NEXT_PUBLIC_VIVENU_HUBBLE_URL) {
			throw new AppError("Vivenu Hubble URL is not configured", 500);
		}

		this.accessToken = config.accessToken;
		this.apiBase = VIVENU_API_URL;
		this.hubbleBase = NEXT_PUBLIC_VIVENU_HUBBLE_URL;
	}

	private buildHeaders(withJson: boolean = true): HeadersInit {
		return {
			Authorization: `Bearer ${this.accessToken}`,
			"x-api-key": VIVENU_API_KEY || "",
			...(withJson ? { "Content-Type": "application/json" } : {}),
		};
	}

	private async request<T>(
		base: "api" | "hubble",
		method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
		endpoint: string,
		body?: unknown,
		queryParams?: Record<string, string>,
	): Promise<T> {
		const root = base === "api" ? this.apiBase : this.hubbleBase;
		const url = new URL(`${root}${endpoint}`);

		if (queryParams) {
			for (const [key, value] of Object.entries(queryParams)) {
				url.searchParams.append(key, value);
			}
		}

		const requestConfig: RequestInit = {
			method,
			headers: this.buildHeaders(body !== undefined),
		};

		if (body !== undefined) {
			requestConfig.body = JSON.stringify(body);
		}

		const response = await fetch(url.toString(), requestConfig);

		const contentType = response.headers.get("content-type");
		const data = contentType?.includes("application/json")
			? await response.json()
			: await response.text();

		if (!response.ok) {
			const errorSnippet =
				typeof data === "string"
					? data.slice(0, 200)
					: JSON.stringify(data).slice(0, 200);
			const snippet = errorSnippet ? ` - ${errorSnippet}` : "";
			const message = `Vivenu API error at ${endpoint}: ${response.status} ${response.statusText}${snippet}`;

			throw new AppError(message, response.status);
		}

		return data as T;
	}

	async apiGet<T>(
		endpoint: string,
		queryParams?: Record<string, string>,
	): Promise<T> {
		return this.request<T>("api", "GET", endpoint, undefined, queryParams);
	}

	async apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>("api", "POST", endpoint, body);
	}

	async apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>("api", "PUT", endpoint, body);
	}

	async hubblePost<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>("hubble", "POST", endpoint, body);
	}

	async fetchApiPaginated<T>(
		endpoint: string,
		options: PaginatedRequestOptions = {},
	): Promise<{
		rows: T[];
		total?: number;
		hasMore: boolean;
		nextToken?: string;
	}> {
		return fetchPaginated<T>(
			`${this.apiBase}${endpoint}`,
			this.accessToken,
			options,
		);
	}
}

export {
	fetchAccessUser,
	fetchAllPOS,
	fetchEvent,
	fetchEvents,
	fetchMe,
	fetchMonthlyPOSRevenue,
	fetchPOS,
	fetchRevenue,
	fetchTicketInventory,
	fetchTicketSales,
	fetchUsers,
	hubbleSearchEvents,
	hubbleSearchTickets,
	inviteUser,
} from "./queries";

export type { DateOperator } from "./types";
