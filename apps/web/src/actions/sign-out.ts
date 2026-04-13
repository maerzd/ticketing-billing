"use server";

import { signOut } from "@workos-inc/authkit-nextjs";
import { clearAuthTokens } from "@/lib/auth";

export async function signOutAction() {
	await clearAuthTokens();
	await signOut();
}
