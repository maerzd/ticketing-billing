"use server";

import { getAccessToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import type { CreateTransferInput } from "@/lib/qonto/services/transfers";
import { TransfersService } from "@/lib/qonto/services/transfers";

/**
 * Verify a payee before creating a transfer
 */
export async function verifyTransferPayee(
	iban: string,
	beneficiary_name: string,
) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new TransfersService(client);

		const result = await service.verifyPayee(iban, beneficiary_name);
		return {
			success: true,
			data: result,
		};
	} catch (error) {
		let message = "Failed to verify payee";

		if (error instanceof AppError) {
			// Handle specific error codes from VOP endpoint
			if (
				error.message.includes("BAD_REQUEST_ERROR_FORMAT") ||
				error.message.includes("BAD_REQUEST")
			) {
				message =
					"Invalid beneficiary details format. Please check the name and IBAN.";
			} else if (error.message.includes("GATEWAY_TIMEOUT")) {
				message = "Bank verification timed out. Please try again later.";
			} else if (error.message.includes("INTERNAL_SERVER_ERROR")) {
				message = "Bank verification service error. Please try again later.";
			} else {
				message = error.message;
			}
		} else if (error instanceof Error) {
			message = error.message;
		}

		console.error("Verify payee error:", message);

		return {
			success: false,
			error: message,
		};
	}
}

/**
 * Create a new SEPA transfer
 */
export async function createTransfer(input: CreateTransferInput) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new TransfersService(client);

		const transfer = await service.createTransfer(input);

		return {
			success: true,
			data: transfer,
		};
	} catch (error) {
		const message =
			error instanceof AppError ? error.message : "Failed to create transfer";

		console.error("Create transfer error:", message);

		return {
			success: false,
			error: message,
		};
	}
}
