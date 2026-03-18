import { NextResponse } from "next/server";
import { setAuthTokens } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { exchangeCodeForToken } from "@/lib/qonto/oauth";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const { searchParams } = url;
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const errorDescription = searchParams.get("error_description");

	// Handle OAuth errors
	if (error) {
		console.error("OAuth error:", error, errorDescription);
		const target = new URL("/login", url.origin);
		target.searchParams.set("error", error);
		target.searchParams.set("description", errorDescription || "");
		return NextResponse.redirect(target);
	}

	// Validate authorization code
	if (!code) {
		console.error("Missing authorization code");
		const target = new URL("/login", url.origin);
		target.searchParams.set("error", "missing_code");
		return NextResponse.redirect(target);
	}

	try {
		// Exchange code for tokens
		const tokens = await exchangeCodeForToken(code);

		// Store tokens in secure cookies
		await setAuthTokens(tokens);

		// Redirect to dashboard
		return NextResponse.redirect(new URL("/dashboard", url.origin));
	} catch (error) {
		const message =
			error instanceof AppError
				? error.message
				: "An error occurred during authentication";

		console.error("Token exchange error:", message, error);
		const target = new URL("/login", url.origin);
		target.searchParams.set("error", "token_exchange_failed");
		target.searchParams.set("description", message);
		return NextResponse.redirect(target);
	}
}
