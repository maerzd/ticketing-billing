import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { getWorkosRedirectUri } from "@/lib/utils";

export const GET = async () => {
	const signInUrl = await getSignInUrl({
		redirectUri: getWorkosRedirectUri(),
	});

	return redirect(signInUrl);
};
