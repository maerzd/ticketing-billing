"use server";

import { cookies } from "next/headers";
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

const VIVENU_JWT_COOKIE = "vivenu_jwt_token";
const VIVENU_TOKEN_EXPIRY_COOKIE = "vivenu_token_expiry";

// Default token expiry: 24 hours if not provided by API
const DEFAULT_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

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
 * Store Vivenu JWT token in secure HTTP-only cookies
 */
export async function setVivenuTokens(
	jwt: string,
	expiresIn: number = DEFAULT_TOKEN_EXPIRY,
) {
	const cookieStore = await cookies();
	const expiresAt = new Date(Date.now() + expiresIn * 1000);

	cookieStore.set(VIVENU_JWT_COOKIE, jwt, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: expiresIn,
		path: "/",
	});

	cookieStore.set(VIVENU_TOKEN_EXPIRY_COOKIE, expiresAt.toISOString(), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: expiresIn,
		path: "/",
	});
}

/**
 * Get the current Vivenu Hubble JWT token, re-logging in if expired or missing
 */
export async function getVivenuHubbleToken(): Promise<string> {
	const loginEmail = VIVENU_EMAIL;

	if (!loginEmail || !VIVENU_PASSWORD) {
		throw new AppError(
			"Vivenu credentials not configured. Set VIVENU_EMAIL and VIVENU_PASSWORD environment variables.",
			500,
		);
	}

	const cookieStore = await cookies();
	const jwt = cookieStore.get(VIVENU_JWT_COOKIE)?.value;
	const expiryStr = cookieStore.get(VIVENU_TOKEN_EXPIRY_COOKIE)?.value;

	// Check if token exists and is not expired
	if (jwt && expiryStr) {
		const expiryTime = new Date(expiryStr).getTime();
		const now = Date.now();
		const fiveMinutes = 5 * 60 * 1000;

		// If token is still valid (not expired and has more than 5 minutes left)
		if (expiryTime - now > fiveMinutes) {
			return jwt;
		}
	}

	// Token is missing or expired, re-login
	try {
		const generatedOtp = await generateVivenuOtp(VIVENU_OTP_SECRET);

		const loginResponse = await loginToVivenu(
			loginEmail,
			VIVENU_PASSWORD,
			generatedOtp,
			VIVENU_LOGIN_TWO_FACTOR_METHOD || "totp",
		);
		await setVivenuTokens(
			loginResponse.jwt,
			loginResponse.expiresIn || DEFAULT_TOKEN_EXPIRY,
		);
		return loginResponse.jwt;
	} catch (error) {
		await clearVivenuTokens();
		throw error;
	}
}

/**
 * Clear all Vivenu authentication tokens
 */
export async function clearVivenuTokens() {
	const cookieStore = await cookies();
	cookieStore.delete(VIVENU_JWT_COOKIE);
	cookieStore.delete(VIVENU_TOKEN_EXPIRY_COOKIE);
}

/**
 * Check if Vivenu is authenticated
 */
export async function isVivenuAuthenticated(): Promise<boolean> {
	const cookieStore = await cookies();
	const jwt = cookieStore.get(VIVENU_JWT_COOKIE)?.value;
	const expiryStr = cookieStore.get(VIVENU_TOKEN_EXPIRY_COOKIE)?.value;

	if (!jwt || !expiryStr) {
		return false;
	}

	const expiryTime = new Date(expiryStr).getTime();
	const now = Date.now();

	return expiryTime > now;
}
