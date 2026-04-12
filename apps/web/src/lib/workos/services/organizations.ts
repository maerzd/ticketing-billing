import type { WorkosClient } from "../client";

export class WorkosOrganizationsService {
    constructor(private client: WorkosClient) { }

    async createOrganization(input: { name: string; externalId: string }) {
        const org = await this.client.workos.organizations.createOrganization({
            name: input.name,
            externalId: input.externalId,
        });
        return { organizationId: org.id };
    }

    async updateOrganization(input: {
        organizationId: string;
        name?: string;
    }) {
        const org = await this.client.workos.organizations.updateOrganization({
            organization: input.organizationId,
            name: input.name,
        });
        return { organizationId: org.id };
    }
}
