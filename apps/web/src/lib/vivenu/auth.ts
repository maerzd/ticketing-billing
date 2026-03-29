import { generate } from "otplib";
import {
	VIVENU_API_URL,
	VIVENU_EMAIL,
	VIVENU_LOGIN_TWO_FACTOR_METHOD,
	VIVENU_OTP_SECRET,
	VIVENU_PASSWORD,
} from "@/lib/constants";
import { AppError, UnauthorizedError } from "@/lib/errors";
import type { VivenuLoginResponse } from "./types";

// Default token expiry: 24 hours if not provided by API
const DEFAULT_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// Anchor the cache on globalThis so it survives HMR module reloads in development.
// In production (serverless) this is per-function-instance — still avoids redundant
// logins within a warm instance and deduplicates concurrent in-flight requests.
declare global {
	// eslint-disable-next-line no-var
	var __vivenuTokenCache: { jwt: string; expiresAt: number } | null;
	// eslint-disable-next-line no-var
	var __vivenuInflightLogin: Promise<string> | null;
}
if (!("__vivenuTokenCache" in globalThis)) globalThis.__vivenuTokenCache = null;
if (!("__vivenuInflightLogin" in globalThis)) globalThis.__vivenuInflightLogin = null;

async function generateVivenuOtp(
	otpSecret?: string,
): Promise<string | undefined> {
	if (!otpSecret) {
		return undefined;
	}

	return generate({ secret: otpSecret });
}

/**
 * Login to Vivenu with email/password and optional MFA payload
 */
export async function loginToVivenu(
	email: string,
	password: string,
	otp?: string,
	loginTwoFactorMethod?: string,
): Promise<VivenuLoginResponse> {
	if (!VIVENU_API_URL) {
		throw new AppError("Vivenu API URL is not configured", 500);
	}

	try {
		const response = await fetch(`${VIVENU_API_URL}/users/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password,
				...(otp ? { otp } : {}),
				...(loginTwoFactorMethod ? { loginTwoFactorMethod } : {}),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new UnauthorizedError(
				`Vivenu login failed: ${response.status} - ${errorText}`,
			);
		}

		const data = await response.json();

		// The response should contain a JWT token
		if (!data.jwt && !data.token && !data.accessToken) {
			throw new AppError("Vivenu login response missing JWT token", 500);
		}

		return {
			jwt: data.jwt || data.token || data.accessToken,
			expiresIn: data.expiresIn || data.expires_in,
			userId: data.userId || data.user_id,
			email: data.email,
		};
	} catch (error) {
		if (error instanceof AppError || error instanceof UnauthorizedError) {
			throw error;
		}
		throw new AppError(`Failed to login to Vivenu: ${error}`, 500);
	}
}

/**
 * Get the current Vivenu Hubble JWT token, re-logging in if expired or missing.
 * Safe to call from any server context (Server Components, Route Handlers, Server Actions).
 */
export async function getVivenuHubbleToken(): Promise<string> {
	if (!VIVENU_EMAIL || !VIVENU_PASSWORD) {
		throw new AppError(
			"Vivenu credentials not configured. Set VIVENU_EMAIL and VIVENU_PASSWORD environment variables.",
			500,
		);
	}

	const fiveMinutes = 5 * 60 * 1000;

	if (globalThis.__vivenuTokenCache && globalThis.__vivenuTokenCache.expiresAt - Date.now() > fiveMinutes) {
		return globalThis.__vivenuTokenCache.jwt;
	}

	// Deduplicate concurrent login attempts — if a login is already in-flight,
	// wait for it instead of firing a second request (thundering herd / HMR burst).
	if (globalThis.__vivenuInflightLogin) {
		return globalThis.__vivenuInflightLogin;
	}

	globalThis.__vivenuInflightLogin = (async () => {
		try {
			const generatedOtp = await generateVivenuOtp(VIVENU_OTP_SECRET);

			const loginResponse = await loginToVivenu(
				VIVENU_EMAIL,
				VIVENU_PASSWORD,
				generatedOtp,
				VIVENU_LOGIN_TWO_FACTOR_METHOD || "totp",
			);

			const expiresIn = loginResponse.expiresIn ?? DEFAULT_TOKEN_EXPIRY;
			globalThis.__vivenuTokenCache = {
				jwt: loginResponse.jwt,
				expiresAt: Date.now() + expiresIn * 1000,
			};

			return globalThis.__vivenuTokenCache.jwt;
		} finally {
			globalThis.__vivenuInflightLogin = null;
		}
	})();

	return globalThis.__vivenuInflightLogin;
}

/**
 * Check if Vivenu is authenticated (token cached and not expiring soon)
 */
export function isVivenuAuthenticated(): boolean {
	const fiveMinutes = 5 * 60 * 1000;
	return globalThis.__vivenuTokenCache !== null && globalThis.__vivenuTokenCache.expiresAt - Date.now() > fiveMinutes;
}

/**
 * Clear the in-memory token cache (e.g. after a credential change)
 */
export function clearVivenuTokens(): void {
	globalThis.__vivenuTokenCache = null;
}
