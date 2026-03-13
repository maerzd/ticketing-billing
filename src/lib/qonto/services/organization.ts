import type { QontoClient } from "@/lib/qonto/client";
import { QontoOrganizationResponseSchema } from "@/types/qonto/organization";

export class OrganizationService {
	constructor(private readonly client: QontoClient) { }

	async getOrganization() {
		return this.client.get("/organization", QontoOrganizationResponseSchema);
	}
}
