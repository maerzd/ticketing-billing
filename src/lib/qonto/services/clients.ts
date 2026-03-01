import type { QontoClient } from "@/lib/qonto/client";
import { ListClientsResponseSchema } from "@/types/clients";

export class ClientsService {
	constructor(private readonly client: QontoClient) {}

	async listClients(page: number = 1, per_page: number = 50) {
		return this.client.get("/clients", ListClientsResponseSchema, {
			page,
			per_page,
		});
	}
}
