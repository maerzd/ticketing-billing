import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import env from "@/env";
import { getAuthorizationUrl } from "@/lib/qonto/oauth";

export async function GET(request: Request) {
	// Generate a cryptographically secure random state for CSRF protection
	const state = randomUUID();
	const url = new URL(request.url);
	const organizationId =
		url.searchParams.get("organization_id") || env.QONTO_ORGANIZATION_ID;
	const registrationId =
		url.searchParams.get("registration_id") || env.QONTO_REGISTRATION_ID;

	// Redirect to Qonto OAuth consent screen
	const authUrl = getAuthorizationUrl(state, {
		organizationId: organizationId || undefined,
		registrationId: registrationId || undefined,
	});
	redirect(authUrl);
}
