import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getAuthorizationUrl } from "@/lib/qonto/oauth";

export async function GET() {
    // Generate a cryptographically secure random state for CSRF protection
    const state = randomUUID();

    // Redirect to Qonto OAuth consent screen
    const authUrl = getAuthorizationUrl(state);
    redirect(authUrl);
}
