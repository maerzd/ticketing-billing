import { redirect } from "next/navigation";
import { clearAuthTokens } from "@/lib/auth";

export async function POST() {
	await clearAuthTokens();
	redirect("/dashboard");
}
