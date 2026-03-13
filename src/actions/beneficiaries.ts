"use server";

import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import {
	BeneficiariesService,
	type CreateBeneficiaryInput,
} from "@/lib/qonto/services/beneficiaries";

const revalidateBeneficiaries = () => {
	revalidatePath("/banking/beneficiaries");
	revalidatePath("/transfers");
};

export async function createSepaBeneficiary(input: CreateBeneficiaryInput) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new BeneficiariesService(client);

		const beneficiary = await service.createBeneficiary(input);
		revalidateBeneficiaries();

		return {
			success: true,
			data: beneficiary,
		};
	} catch (error) {
		const message =
			error instanceof AppError
				? error.message
				: "Failed to create beneficiary";

		console.error("Create beneficiary error:", message);

		return {
			success: false,
			error: message,
		};
	}
}

export async function trustSepaBeneficiaries(ids: string[]) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new BeneficiariesService(client);

		const beneficiaries = await service.trustBeneficiaries(ids);
		revalidateBeneficiaries();

		return {
			success: true,
			data: beneficiaries,
		};
	} catch (error) {
		const message =
			error instanceof AppError ? error.message : "Failed to trust beneficiary";

		console.error("Trust beneficiaries error:", message);

		return {
			success: false,
			error: message,
		};
	}
}

export async function untrustSepaBeneficiaries(ids: string[]) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new BeneficiariesService(client);

		const beneficiaries = await service.untrustBeneficiaries(ids);
		revalidateBeneficiaries();

		return {
			success: true,
			data: beneficiaries,
		};
	} catch (error) {
		const message =
			error instanceof AppError
				? error.message
				: "Failed to untrust beneficiary";

		console.error("Untrust beneficiaries error:", message);

		return {
			success: false,
			error: message,
		};
	}
}
