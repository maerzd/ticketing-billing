import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";

export const GET = async (request: Request) => {
	const requestOrigin = new URL(request.url).origin;
	const baseUrl = requestOrigin || getBaseUrl();

	const signInUrl = await getSignInUrl({
		redirectUri: `${baseUrl}/api/auth/callback`,
	});

	return redirect(signInUrl);
};
