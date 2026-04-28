import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { getBaseUrl } from "@/lib/utils";

// In middleware auth mode, each page is protected by default.
// Exceptions are configured via the `unauthenticatedPaths` option.
export default authkitMiddleware({
	redirectUri: `${getBaseUrl()}/api/auth/callback`,
	middlewareAuth: {
		enabled: true,
		unauthenticatedPaths: ["/auth"],
	},
});

// Match against pages that require authentication
// Leave this out if you want authentication on every page in your application
export const config = {};
