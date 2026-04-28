"use server";

import { cookies } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";
import { type QontoTokenResponse, refreshAccessToken } from "@/lib/qonto/oauth";

const ACCESS_TOKEN_COOKIE = "qonto_access_token";
const REFRESH_TOKEN_COOKIE = "qonto_refresh_token";
const TOKEN_EXPIRY_COOKIE = "qonto_token_expiry";
const OAUTH_STATE_COOKIE = "qonto_oauth_state";

function isCookieMutationNotAllowedError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return error.message.includes(
		"Cookies can only be modified in a Server Action or Route Handler",
	);
}

/**
 * Store tokens in secure HTTP-only cookies
 */
export async function setAuthTokens(tokens: QontoTokenResponse) {
	const cookieStore = await cookies();
	const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

	cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: tokens.expires_in,
		path: "/",
	});

	cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 90 * 24 * 60 * 60, // 90 days
		path: "/",
	});

	cookieStore.set(TOKEN_EXPIRY_COOKIE, expiresAt.toISOString(), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: tokens.expires_in,
		path: "/",
	});
}

/**
 * Get the current access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
	const cookieStore = await cookies();
	let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
	const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
	const expiryStr = cookieStore.get(TOKEN_EXPIRY_COOKIE)?.value;

	if (!refreshToken) {
		throw new UnauthorizedError("No refresh token found");
	}

	// Check if token is expired or about to expire (within 5 minutes)
	const expiryTime = expiryStr ? new Date(expiryStr).getTime() : 0;
	const now = Date.now();
	const fiveMinutes = 5 * 60 * 1000;

	if (!accessToken || expiryTime - now < fiveMinutes) {
		try {
			const newTokens = await refreshAccessToken(refreshToken);
			accessToken = newTokens.access_token;

			// During Server Component rendering Next.js allows reading cookies but not
			// mutating them. We still return the fresh access token for this request.
			try {
				await setAuthTokens(newTokens);
			} catch (error) {
				if (!isCookieMutationNotAllowedError(error)) {
					throw error;
				}
				console.warn(
					"Qonto token refreshed but cookies could not be updated (Server Component context). The client-side refresher will persist the new tokens.",
				);
			}
		} catch (_error) {
			// If refresh fails, clear cookies and throw error
			try {
				await clearAuthTokens();
			} catch (error) {
				if (!isCookieMutationNotAllowedError(error)) {
					throw error;
				}
			}
			throw new UnauthorizedError("Token refresh failed");
		}
	}

	return accessToken;
}

/**
 * Clear all authentication tokens
 */
export async function clearAuthTokens() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_TOKEN_COOKIE);
	cookieStore.delete(REFRESH_TOKEN_COOKIE);
	cookieStore.delete(TOKEN_EXPIRY_COOKIE);
}

/**
 * Store the OAuth state parameter in a short-lived cookie for CSRF validation.
 */
export async function setOAuthState(state: string) {
	const cookieStore = await cookies();
	cookieStore.set(OAUTH_STATE_COOKIE, state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 300, // 5 minutes
		path: "/",
	});
}

/**
 * Read and delete the OAuth state cookie. Returns null if missing.
 */
export async function getAndClearOAuthState(): Promise<string | null> {
	const cookieStore = await cookies();
	const state = cookieStore.get(OAUTH_STATE_COOKIE)?.value ?? null;
	cookieStore.delete(OAUTH_STATE_COOKIE);
	return state;
}

/**
 * Refresh auth tokens using the refresh token cookie.
 * Intended for Route Handlers or Server Actions where cookie mutation is allowed.
 * Only calls Qonto when the access token is expired or within 5 minutes of expiry
 * to avoid burning rotating refresh tokens unnecessarily.
 */
export async function refreshAuthTokensFromCookies(): Promise<boolean> {
	const cookieStore = await cookies();
	const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
	const expiryStr = cookieStore.get(TOKEN_EXPIRY_COOKIE)?.value;
	const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

	if (!refreshToken) {
		return false;
	}

	// Don't refresh if the access token is still valid with >5 min remaining.
	const expiryTime = expiryStr ? new Date(expiryStr).getTime() : 0;
	const fiveMinutes = 5 * 60 * 1000;
	if (accessToken && expiryTime - Date.now() > fiveMinutes) {
		return true;
	}

	try {
		const newTokens = await refreshAccessToken(refreshToken);
		await setAuthTokens(newTokens);
		return true;
	} catch (error) {
		// Log for diagnostics but do NOT clear cookies here — a failed proactive
		// refresh should not log the user out. getAccessToken() will handle
		// the authoritative failure path when an actual API call is needed.
		console.error("Proactive token refresh failed:", error);
		return false;
	}
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
		const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
		return !!(accessToken && refreshToken);
	} catch {
		return false;
	}
}
