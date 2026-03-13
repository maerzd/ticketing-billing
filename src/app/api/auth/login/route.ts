import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";

export const GET = async () => {
	const signInUrl = await getSignInUrl({
		redirectUri: `${getBaseUrl()}/api/auth/callback`,
	});

	return redirect(signInUrl);
};
