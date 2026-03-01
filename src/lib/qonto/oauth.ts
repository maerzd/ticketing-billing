import env from "@/env";
import { OAuthError } from "@/lib/errors";
import type { QontoOAuthError, QontoTokenResponse } from "@/types/qonto";
import { getBaseUrl } from "../utils";

const SANDBOX_AUTH_URL = "https://oauth-sandbox.staging.qonto.co/oauth2/auth";
const SANDBOX_TOKEN_URL = "https://oauth-sandbox.staging.qonto.co/oauth2/token";
const PRODUCTION_AUTH_URL = "https://oauth.qonto.com/oauth2/auth";
const PRODUCTION_TOKEN_URL = "https://oauth.qonto.com/oauth2/token";

const getAuthUrl = () =>
	env.QONTO_SANDBOX ? SANDBOX_AUTH_URL : PRODUCTION_AUTH_URL;
const getTokenUrl = () =>
	env.QONTO_SANDBOX ? SANDBOX_TOKEN_URL : PRODUCTION_TOKEN_URL;

const getOAuthHeaders = (): Record<string, string> => {
	const headers: Record<string, string> = {
		"Content-Type": "application/x-www-form-urlencoded",
	};

	if (env.QONTO_SANDBOX && env.QONTO_STAGING_TOKEN) {
		headers["X-Qonto-Staging-Token"] = env.QONTO_STAGING_TOKEN;
	}

	return headers;
};

const SCOPES = [
	"offline_access",
	"organization.read",
	"client_invoices.read",
	"client_invoice.write",
	"client.read",
	"payment.write",
];

/**
 * Generate the Qonto OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: env.QONTO_CLIENT_ID,
		redirect_uri: `${getBaseUrl()}/api/auth/callback`,
		response_type: "code",
		scope: SCOPES.join(" "),
		state,
	});

	return `${getAuthUrl()}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForToken(
	code: string,
): Promise<QontoTokenResponse> {
	const tokenUrl = getTokenUrl();
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		client_id: env.QONTO_CLIENT_ID,
		client_secret: env.QONTO_CLIENT_SECRET,
		redirect_uri: `${getBaseUrl()}/api/auth/callback`,
	}).toString();

	const response = await fetch(tokenUrl, {
		method: "POST",
		headers: getOAuthHeaders(),
		body,
	});

	const responseText = await response.text();

	let data: unknown;
	try {
		data = JSON.parse(responseText);
	} catch (parseError) {
		console.error("Failed to parse OAuth response as JSON:", parseError);
		console.error("Token endpoint:", tokenUrl, "status:", response.status);
		console.error("Response snippet:", responseText.substring(0, 300));
		throw new Error(
			`Token endpoint returned invalid JSON: ${response.status} ${response.statusText}`,
		);
	}

	if (!response.ok) {
		console.error(
			"Token exchange failed:",
			JSON.stringify(data),
			"Response status:",
			response.status,
		);
		const error = data as QontoOAuthError;
		throw new OAuthError(`OAuth token exchange failed: ${error.error}`, error);
	}

	return data as QontoTokenResponse;
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
	refreshToken: string,
): Promise<QontoTokenResponse> {
	const response = await fetch(getTokenUrl(), {
		method: "POST",
		headers: getOAuthHeaders(),
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: env.QONTO_CLIENT_ID,
			client_secret: env.QONTO_CLIENT_SECRET,
		}).toString(),
	});

	const data = await response.json();

	if (!response.ok) {
		const error = data as QontoOAuthError;
		throw new OAuthError(`Token refresh failed: ${error.error}`, error);
	}

	return data as QontoTokenResponse;
}
