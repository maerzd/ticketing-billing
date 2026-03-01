import { getAccessToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import { BankAccountsService } from "@/lib/qonto/services/bankAccounts";
import { BeneficiariesService } from "@/lib/qonto/services/beneficiaries";
import { InvoicesService } from "@/lib/qonto/services/invoices";
import { OrganizationService } from "@/lib/qonto/services/organization";
import { TransfersService } from "@/lib/qonto/services/transfers";

const extractErrorMessage = (error: unknown, fallback: string) => {
	if (error instanceof AppError) {
		return error.message;
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
};

export async function queryOrganization() {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new OrganizationService(client);

		const org = await service.getOrganization();

		return {
			success: true,
			data: org,
		} as const;
	} catch (error) {
		const message = extractErrorMessage(error, "Failed to fetch organization");

		console.error("Query organization error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function queryInvoices(page: number = 1) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new InvoicesService(client);

		const result = await service.listInvoices(page);

		return {
			success: true,
			data: result,
		} as const;
	} catch (error) {
		const message = extractErrorMessage(error, "Failed to fetch invoices");

		console.error("Query invoices error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function queryTransfers(page: number = 1) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new TransfersService(client);

		const result = await service.listTransfers(page);

		return {
			success: true,
			data: result,
		} as const;
	} catch (error) {
		const message = extractErrorMessage(error, "Failed to fetch transfers");

		console.error("Query transfers error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function queryBeneficiaries(page: number = 1) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new BeneficiariesService(client);

		const result = await service.listBeneficiaries(page);

		return {
			success: true,
			data: result,
		} as const;
	} catch (error) {
		const message = extractErrorMessage(error, "Failed to fetch beneficiaries");

		console.error("Query beneficiaries error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function queryBankAccounts(page: number = 1) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new BankAccountsService(client);

		const result = await service.listBankAccounts(page);

		return {
			success: true,
			data: result,
		} as const;
	} catch (error) {
		const message = extractErrorMessage(error, "Failed to fetch bank accounts");

		console.error("Query bank accounts error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}
