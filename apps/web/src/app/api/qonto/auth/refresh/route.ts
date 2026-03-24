import { NextResponse } from "next/server";
import { refreshAuthTokensFromCookies } from "@/lib/auth";

export async function POST() {
	const refreshed = await refreshAuthTokensFromCookies();

	if (!refreshed) {
		return NextResponse.json(
			{ error: "Unable to refresh Qonto session" },
			{ status: 401 },
		);
	}

	return new NextResponse(null, { status: 204 });
}
