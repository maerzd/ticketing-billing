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

// Module-level cache — Vivenu is a shared service credential, not per-user.
// This works in any server context (Server Components, Route Handlers, Server Actions).
// On serverless cold starts the cache is empty and a fresh login is performed transparently.
// Could be improved by using a more robust caching strategy (e.g. Redis) if needed in the future.
let tokenCache: { jwt: string; expiresAt: number } | null = null;

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

	if (tokenCache && tokenCache.expiresAt - Date.now() > fiveMinutes) {
		return tokenCache.jwt;
	}

	// Cache is empty or token is about to expire — re-login
	const generatedOtp = await generateVivenuOtp(VIVENU_OTP_SECRET);

	const loginResponse = await loginToVivenu(
		VIVENU_EMAIL,
		VIVENU_PASSWORD,
		generatedOtp,
		VIVENU_LOGIN_TWO_FACTOR_METHOD || "totp",
	);

	const expiresIn = loginResponse.expiresIn ?? DEFAULT_TOKEN_EXPIRY;
	tokenCache = {
		jwt: loginResponse.jwt,
		expiresAt: Date.now() + expiresIn * 1000,
	};

	return tokenCache.jwt;
}

/**
 * Check if Vivenu is authenticated (token cached and not expiring soon)
 */
export function isVivenuAuthenticated(): boolean {
	const fiveMinutes = 5 * 60 * 1000;
	return tokenCache !== null && tokenCache.expiresAt - Date.now() > fiveMinutes;
}

/**
 * Clear the in-memory token cache (e.g. after a credential change)
 */
export function clearVivenuTokens(): void {
	tokenCache = null;
}
