"use server";

import { redirect } from "next/navigation";
import { clearAuthTokens } from "@/lib/auth";

export async function qontoLogoutAction() {
	await clearAuthTokens();
	redirect("/dashboard");
}
