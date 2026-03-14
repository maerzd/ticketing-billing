import { redirect } from "next/navigation";
import { clearAuthTokens } from "@/lib/auth";

export async function GET() {
	// Clear authentication tokens
	await clearAuthTokens();

	// Redirect to dashboard
	redirect("/");
}
