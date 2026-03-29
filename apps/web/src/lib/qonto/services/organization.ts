import { QontoOrganizationResponseSchema } from "@ticketing-billing/types/qonto/organization";
import type { QontoClient } from "@/lib/qonto/client";

export class OrganizationService {
	constructor(private readonly client: QontoClient) {}

	async getOrganization() {
		return this.client.get("/organization", QontoOrganizationResponseSchema);
	}
}
