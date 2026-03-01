import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/invoices", "/transfers"];

// Routes that are public
const publicRoutes = new Set([
	"/login",
	"/api/auth/login",
	"/api/auth/callback",
	"/api/auth/logout",
]);

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if route is public
	if (publicRoutes.has(pathname)) {
		return NextResponse.next();
	}

	// Check if route requires authentication
	const isProtected = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	if (!isProtected) {
		return NextResponse.next();
	}

	// Check for authentication tokens
	const accessToken = request.cookies.get("qonto_access_token");
	const refreshToken = request.cookies.get("qonto_refresh_token");

	// Redirect to login if no tokens
	if (!accessToken || !refreshToken) {
		const loginUrl = new URL("/login", request.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public).*)",
	],
};
