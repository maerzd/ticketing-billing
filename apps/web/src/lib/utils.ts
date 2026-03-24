import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export interface FormatNumberOptions extends Intl.NumberFormatOptions {}

export function formatNumber(
	num: number | undefined | null,
	digits = 2,
	locale = "de-DE",
	options: FormatNumberOptions = {},
): string {
	if (num === null || num === undefined) {
		return "";
	}
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
		...options,
	}).format(num);
}

export function formatCurrency(
	num: number,
	currency = "EUR",
	locale = "de-DE",
	options: FormatNumberOptions = {},
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		...options,
	}).format(num);
}

function normalizeUrl(url: string): string {
	return url.replace(/\/$/, "");
}

function _isLocalhostUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
	} catch {
		return false;
	}
}

/**
 * Get the canonical base URL for the application.
 *
 * This function prioritizes configured environment variables over request headers
 * to prevent host header injection attacks. The precedence is:
 * 1. NEXT_PUBLIC_SITE_URL - Production canonical URL
 * 2. VERCEL_URL - Vercel deployment URL (for preview/staging)
 * 3. Fallback to localhost for local development
 *
 * @returns The canonical base URL without trailing slash
 */
export function getBaseUrl(): string {
	// 1. Fall back to the production URL when available.
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`;
	}

	// 2. On Vercel, use the deployment URL (works for preview and production).
	if (process.env.VERCEL_URL) {
		return `https://${normalizeUrl(process.env.VERCEL_URL)}`;
	}

	// 3. Fallback for local development
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}

	// 4. Safe fallback - this should never be reached in production
	throw new Error(
		"Unable to determine base URL. Please set NEXT_PUBLIC_SITE_URL, VERCEL_URL, or VERCEL_PROJECT_PRODUCTION_URL environment variable.",
	);
}
