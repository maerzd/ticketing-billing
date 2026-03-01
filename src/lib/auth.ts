"use server";

import { cookies } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";
import { refreshAccessToken } from "@/lib/qonto/oauth";
import type { QontoTokenResponse } from "@/types/qonto";

const ACCESS_TOKEN_COOKIE = "qonto_access_token";
const REFRESH_TOKEN_COOKIE = "qonto_refresh_token";
const TOKEN_EXPIRY_COOKIE = "qonto_token_expiry";

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

	if (!accessToken || !refreshToken) {
		throw new UnauthorizedError("No authentication tokens found");
	}

	// Check if token is expired or about to expire (within 5 minutes)
	const expiryTime = expiryStr ? new Date(expiryStr).getTime() : 0;
	const now = Date.now();
	const fiveMinutes = 5 * 60 * 1000;

	if (expiryTime - now < fiveMinutes) {
		try {
			const newTokens = await refreshAccessToken(refreshToken);
			await setAuthTokens(newTokens);
			accessToken = newTokens.access_token;
		} catch (_error) {
			// If refresh fails, clear cookies and throw error
			await clearAuthTokens();
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
