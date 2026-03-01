import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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
	// 1. First check for explicitly configured site URL (fallback for production)
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
	}

	// 2. On Vercel, use the VERCEL_PROJECT_PRODUCTION_URL system environment variable
	// See: https://vercel.com/docs/environment-variables/system-environment-variables#VERCEL_PROJECT_PRODUCTION_URL
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}

	// 3. Fallback for local development
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}

	// 4. Safe fallback - this should never be reached in production
	throw new Error(
		"Unable to determine base URL. Please set NEXT_PUBLIC_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL environment variable.",
	);
}
