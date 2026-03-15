import type { QontoClient } from "@/lib/qonto/client";
import {
	type CreateClientInput,
	CreateClientInputSchema,
	CreateClientResponseSchema,
	ListClientsResponseSchema,
	RetrieveClientResponseSchema,
	type UpdateClientInput,
	UpdateClientInputSchema,
	UpdateClientResponseSchema,
} from "@/types/qonto/clients";

type ClientKind = CreateClientInput["kind"];

interface ListClientsFilter {
	name?: string;
	email?: string;
	vat_number?: string;
	tax_identification_number?: string;
	updated_at_from?: string;
	updated_at_to?: string;
}

interface ListClientsOptions {
	page?: number;
	per_page?: number;
	sort_by?:
	| "created_at:asc"
	| "created_at:desc"
	| "updated_at:asc"
	| "updated_at:desc"
	| "name:asc"
	| "name:desc";
	filter?: ListClientsFilter;
	kind?: ClientKind;
}

export type { CreateClientInput, UpdateClientInput };

export class ClientsService {
	constructor(private readonly client: QontoClient) { }

	async listClients(options: ListClientsOptions = {}) {
		const {
			page = 1,
			per_page = 25,
			sort_by = "name:asc",
			filter,
			kind,
		} = options;

		const queryParams: Record<string, string | number> = {
			page,
			per_page,
			sort_by,
		};

		if (kind) {
			queryParams["filter[kind]"] = kind;
		}

		if (filter?.name) {
			queryParams["filter[name]"] = filter.name;
		}

		if (filter?.email) {
			queryParams["filter[email]"] = filter.email;
		}

		if (filter?.vat_number) {
			queryParams["filter[vat_number]"] = filter.vat_number;
		}

		if (filter?.tax_identification_number) {
			queryParams["filter[tax_identification_number]"] =
				filter.tax_identification_number;
		}

		if (filter?.updated_at_from) {
			queryParams["filter[updated_at_from]"] = filter.updated_at_from;
		}

		if (filter?.updated_at_to) {
			queryParams["filter[updated_at_to]"] = filter.updated_at_to;
		}

		return this.client.get("/clients", ListClientsResponseSchema, queryParams);
	}

	async retrieveClient(id: string) {
		return this.client
			.get(`/clients/${id}`, RetrieveClientResponseSchema)
			.then((response) => response.client);
	}

	async createClient(input: CreateClientInput) {
		const validated = CreateClientInputSchema.parse(input);
		const headers: Record<string, string> = {
			"X-Qonto-Idempotency-Key": crypto.randomUUID(),
		};

		return this.client
			.post("/clients", CreateClientResponseSchema, validated, headers)
			.then((response) => response.client);
	}

	async updateClient(id: string, input: UpdateClientInput) {
		const validated = UpdateClientInputSchema.parse(input);

		return this.client
			.patch(`/clients/${id}`, UpdateClientResponseSchema, validated)
			.then((response) => response.client);
	}
}
