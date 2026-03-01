import type { z } from "zod";
import env from "@/env";
import { AppError, QontoAPIErrorHandler } from "@/lib/errors";
import type { QontoAPIError } from "@/types/qonto";

const SANDBOX_API_BASE = "https://thirdparty-sandbox.staging.qonto.co/v2";
const PRODUCTION_API_BASE = "https://thirdparty.qonto.com/v2";

const getApiBase = () =>
	env.QONTO_SANDBOX ? SANDBOX_API_BASE : PRODUCTION_API_BASE;

export interface QontoClientConfig {
	accessToken: string;
}

export class QontoClient {
	private readonly accessToken: string;
	private readonly apiBase: string;

	constructor(config: QontoClientConfig) {
		this.accessToken = config.accessToken;
		this.apiBase = getApiBase();
	}

	private async request<T>(
		method: "GET" | "POST" | "PUT" | "DELETE",
		endpoint: string,
		schema: z.ZodSchema<T>,
		body?: unknown,
		queryParams?: Record<string, string | number>,
		extraHeaders?: Record<string, string>,
	): Promise<T> {
		const url = new URL(`${this.apiBase}${endpoint}`);

		if (queryParams) {
			Object.entries(queryParams).forEach(([key, value]) => {
				url.searchParams.append(key, String(value));
			});
		}

		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.accessToken}`,
			"Content-Type": "application/json",
		};

		if (env.QONTO_SANDBOX) {
			headers["X-Qonto-Staging-Token"] = env.QONTO_STAGING_TOKEN as string;
		}

		if (extraHeaders) {
			Object.assign(headers, extraHeaders);
		}

		const fetchConfig: RequestInit = {
			method,
			headers,
		};

		if (body) {
			fetchConfig.body = JSON.stringify(body);
		}

		const response = await fetch(url.toString(), fetchConfig);

		// Handle non-JSON responses
		let data: unknown;
		const contentType = response.headers.get("content-type");

		if (contentType?.includes("application/json")) {
			data = await response.json();
		} else {
			data = await response.text();
		}
		console.log(`Qonto API response from ${endpoint}:`, {
			status: response.status,
			statusText: response.statusText,
			body: data,
		});
		// Check for API errors
		if (!response.ok) {
			if (typeof data === "object" && data !== null && "errors" in data) {
				const apiError = data as QontoAPIError;
				throw QontoAPIErrorHandler.fromAPIResponse(apiError.errors);
			}

			// Handle other error response formats (code, error fields)
			if (typeof data === "object" && data !== null) {
				const errorData = data as Record<string, unknown>;
				if (errorData.code || errorData.error) {
					const errorMsg = (errorData.code || errorData.error) as string;
					throw new AppError(
						`Qonto API error at ${endpoint}: ${errorMsg}`,
						response.status,
					);
				}
			}

			const textBody = typeof data === "string" ? data : "";
			const snippet = textBody.slice(0, 200).replaceAll("\n", " ");
			const errorMessage = `Qonto API error at ${endpoint}: ${response.status} ${response.statusText}${snippet ? ` - ${snippet}` : ""}`;
			throw new AppError(errorMessage, response.status);
		}

		// Validate and return response
		return schema.parse(data);
	}

	async get<T>(
		endpoint: string,
		schema: z.ZodSchema<T>,
		queryParams?: Record<string, string | number>,
		extraHeaders?: Record<string, string>,
	): Promise<T> {
		return this.request(
			"GET",
			endpoint,
			schema,
			undefined,
			queryParams,
			extraHeaders,
		);
	}

	async post<T>(
		endpoint: string,
		schema: z.ZodSchema<T>,
		body?: unknown,
		extraHeaders?: Record<string, string>,
	): Promise<T> {
		return this.request(
			"POST",
			endpoint,
			schema,
			body,
			undefined,
			extraHeaders,
		);
	}

	async put<T>(
		endpoint: string,
		schema: z.ZodSchema<T>,
		body?: unknown,
		extraHeaders?: Record<string, string>,
	): Promise<T> {
		return this.request("PUT", endpoint, schema, body, undefined, extraHeaders);
	}
}
