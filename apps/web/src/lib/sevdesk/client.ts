import type { z } from "zod";
import { ZodError } from "zod";
import { da } from "zod/locales";
import env from "@/env";
import { AppError, ValidationError } from "@/lib/errors";

export class SevdeskClient {
	private readonly apiBase: string;
	private readonly apiToken: string;

	constructor() {
		this.apiBase = env.SEVDESK_API_URL;
		this.apiToken = env.SEVDESK_API_TOKEN.trim();
	}

	private async request<T>(
		method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
		endpoint: string,
		schema: z.ZodSchema<T>,
		body?: unknown,
		queryParams?: Record<string, string | number>,
	): Promise<T> {
		const url = new URL(`${this.apiBase}${endpoint}`);
		url.searchParams.set("token", this.apiToken);

		if (queryParams) {
			for (const [key, value] of Object.entries(queryParams)) {
				url.searchParams.append(key, String(value));
			}
		}

		const response = await fetch(url.toString(), {
			method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: this.apiToken,
				"X-Api-Token": this.apiToken,
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		});

		const contentType = response.headers.get("content-type");
		const data = contentType?.includes("application/json")
			? await response.json()
			: await response.text();

		if (!response.ok) {
			const snippet =
				typeof data === "string"
					? data.slice(0, 200).replaceAll("\n", " ")
					: JSON.stringify(data).slice(0, 200);

			throw new AppError(
				`Sevdesk API error at ${endpoint}: ${response.status} ${response.statusText}${snippet ? ` - ${snippet}` : ""}`,
				response.status,
			);
		}

		try {
			return schema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				const details = error.issues
					.map(
						(issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
					)
					.join("; ");

				throw new ValidationError(
					`Response validation error at ${endpoint}: ${details}`,
				);
			}

			throw error;
		}
	}

	async get<T>(
		endpoint: string,
		schema: z.ZodSchema<T>,
		queryParams?: Record<string, string | number>,
	) {
		return this.request("GET", endpoint, schema, undefined, queryParams);
	}

	async post<T>(endpoint: string, schema: z.ZodSchema<T>, body?: unknown) {
		return this.request("POST", endpoint, schema, body);
	}

	async put<T>(endpoint: string, schema: z.ZodSchema<T>, body?: unknown) {
		return this.request("PUT", endpoint, schema, body);
	}

	async delete<T>(
		endpoint: string,
		schema: z.ZodSchema<T>,
		queryParams?: Record<string, string | number>,
	) {
		return this.request("DELETE", endpoint, schema, undefined, queryParams);
	}
}
