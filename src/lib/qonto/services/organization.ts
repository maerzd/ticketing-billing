import type { QontoClient } from "@/lib/qonto/client";
import { QontoOrganizationResponseSchema } from "@/types/qonto";

export class OrganizationService {
	constructor(private readonly client: QontoClient) {}

	async getOrganization() {
		return this.client.get("/organization", QontoOrganizationResponseSchema);
	}
}
