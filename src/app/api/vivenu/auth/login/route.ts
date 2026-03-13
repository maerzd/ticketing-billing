import { NextResponse } from "next/server";
import { VIVENU_EMAIL, VIVENU_PASSWORD } from "@/lib/constants";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { getVivenuHubbleToken } from "@/lib/vivenu/auth";

export async function POST() {
	try {
		const loginEmail = VIVENU_EMAIL;

		// Check if credentials are configured
		if (!loginEmail || !VIVENU_PASSWORD) {
			return NextResponse.json(
				{
					error: "Vivenu credentials not configured",
					message: "Set VIVENU_EMAIL and VIVENU_PASSWORD environment variables",
				},
				{ status: 500 },
			);
		}

		// Login to Vivenu (OTP is generated internally from VIVENU_OTP_SECRET)
		await getVivenuHubbleToken();

		return NextResponse.json({
			success: true,
			message: "Successfully authenticated with Vivenu",
		});
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return NextResponse.json(
				{
					error: "Authentication failed",
					message: error.message,
				},
				{ status: 401 },
			);
		}

		if (error instanceof AppError) {
			return NextResponse.json(
				{
					error: error.message,
				},
				{ status: error.statusCode },
			);
		}

		return NextResponse.json(
			{
				error: "Internal server error",
				message: String(error),
			},
			{ status: 500 },
		);
	}
}
