"use server";

import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import {
	ClientsService,
	type CreateClientInput,
	type UpdateClientInput,
} from "@/lib/qonto/services/clients";
import type { Client } from "@/types/qonto/clients";

interface DuplicateCheckInput {
	name?: string;
	email?: string;
	vat_number?: string;
	tax_identification_number?: string;
}

interface DuplicateCheckResult {
	blocking: Client[];
	warnings: Client[];
}

const revalidateClients = () => {
	revalidatePath("/banking/clients");
	revalidatePath("/banking/invoices");
};

const getErrorMessage = (error: unknown, fallback: string) => {
	if (error instanceof AppError) {
		return error.message;
	}

	return error instanceof Error ? error.message : fallback;
};

const normalizeLocale = (locale?: string) => {
	if (!locale) return locale;
	return locale.trim().slice(0, 2).toLowerCase();
};

const uniqueClients = (clients: Client[]) => {
	const map = new Map<string, Client>();
	for (const client of clients) {
		map.set(client.id, client);
	}

	return [...map.values()];
};

export async function checkClientDuplicates(input: DuplicateCheckInput) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new ClientsService(client);

		const [emailResult, vatResult, taxResult, nameResult] = await Promise.all([
			input.email
				? service.listClients({
						page: 1,
						per_page: 50,
						filter: { email: input.email.trim() },
					})
				: Promise.resolve({ clients: [] as Client[], meta: null }),
			input.vat_number
				? service.listClients({
						page: 1,
						per_page: 50,
						filter: { vat_number: input.vat_number.trim() },
					})
				: Promise.resolve({ clients: [] as Client[], meta: null }),
			input.tax_identification_number
				? service.listClients({
						page: 1,
						per_page: 50,
						filter: {
							tax_identification_number: input.tax_identification_number.trim(),
						},
					})
				: Promise.resolve({ clients: [] as Client[], meta: null }),
			input.name && input.name.trim().length >= 2
				? service.listClients({
						page: 1,
						per_page: 20,
						filter: { name: input.name.trim() },
					})
				: Promise.resolve({ clients: [] as Client[], meta: null }),
		]);

		const blocking = uniqueClients([
			...emailResult.clients,
			...vatResult.clients,
			...taxResult.clients,
		]);

		const warningCandidates = nameResult.clients.filter(
			(candidate) => !blocking.some((blocked) => blocked.id === candidate.id),
		);

		const result: DuplicateCheckResult = {
			blocking,
			warnings: uniqueClients(warningCandidates),
		};

		return {
			success: true,
			data: result,
		} as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to check duplicate clients");

		console.error("Check client duplicates error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function createClient(input: CreateClientInput) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new ClientsService(client);

		const created = await service.createClient({
			...input,
			locale: normalizeLocale(input.locale),
		});

		revalidateClients();

		return {
			success: true,
			data: created,
		} as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to create client");

		console.error("Create client error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function updateClient(id: string, input: UpdateClientInput) {
	try {
		const accessToken = await getAccessToken();
		const client = new QontoClient({ accessToken });
		const service = new ClientsService(client);

		const updated = await service.updateClient(id, {
			...input,
			locale: normalizeLocale(input.locale),
		});

		revalidateClients();

		return {
			success: true,
			data: updated,
		} as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to update client");

		console.error("Update client error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}
