import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import env from "@/env";
import { setOAuthState } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/qonto/oauth";

export async function GET(request: Request) {
	// Generate a cryptographically secure random state for CSRF protection
	const state = randomUUID();
	await setOAuthState(state);

	let organizationId = env.QONTO_ORGANIZATION_ID;
	let registrationId = env.QONTO_REGISTRATION_ID;

	// Allow query-param overrides only in development
	if (process.env.NODE_ENV === "development") {
		const url = new URL(request.url);
		organizationId = url.searchParams.get("organization_id") || organizationId;
		registrationId = url.searchParams.get("registration_id") || registrationId;
	}

	// Redirect to Qonto OAuth consent screen
	const authUrl = getAuthorizationUrl(state, {
		organizationId: organizationId || undefined,
		registrationId: registrationId || undefined,
	});
	redirect(authUrl);
}
