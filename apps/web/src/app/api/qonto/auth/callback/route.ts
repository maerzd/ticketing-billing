import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAndClearOAuthState, setAuthTokens } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { exchangeCodeForToken } from "@/lib/qonto/oauth";
import { getBaseUrl } from "@/lib/utils";

function buildDashboardErrorUrl(error: string, description?: string): URL {
	const target = new URL("/dashboard", getBaseUrl());
	target.searchParams.set("qonto_error", error);
	if (description) {
		target.searchParams.set("qonto_error_description", description);
	}
	return target;
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");
	const errorDescription = searchParams.get("error_description");

	// Validate OAuth state to prevent CSRF / login attacks
	const storedState = await getAndClearOAuthState();
	if (
		!state ||
		!storedState ||
		!timingSafeEqual(Buffer.from(state), Buffer.from(storedState))
	) {
		console.error("OAuth state mismatch", { state, storedState });
		return NextResponse.redirect(
			buildDashboardErrorUrl("state_mismatch", "OAuth state validation failed"),
		);
	}

	// Handle OAuth errors from the provider
	if (error) {
		console.error("OAuth error:", error, errorDescription);
		return NextResponse.redirect(
			buildDashboardErrorUrl(error, errorDescription || undefined),
		);
	}

	// Validate authorization code
	if (!code) {
		console.error("Missing authorization code");
		return NextResponse.redirect(
			buildDashboardErrorUrl("missing_code", "No authorization code received"),
		);
	}

	try {
		// Exchange code for tokens
		const tokens = await exchangeCodeForToken(code);

		// Store tokens in secure cookies
		await setAuthTokens(tokens);

		// Redirect to dashboard
		return NextResponse.redirect(new URL("/dashboard", getBaseUrl()));
	} catch (error) {
		const message =
			error instanceof AppError
				? error.message
				: "An error occurred during authentication";

		console.error("Token exchange error:", message, error);
		return NextResponse.redirect(
			buildDashboardErrorUrl("token_exchange_failed", message),
		);
	}
}
