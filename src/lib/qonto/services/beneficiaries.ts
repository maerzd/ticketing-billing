import type { QontoClient } from "@/lib/qonto/client";
import { QontoSepaBeneficiaryListSchema } from "@/types/qonto";

export class BeneficiariesService {
	constructor(private readonly client: QontoClient) {}

	async listBeneficiaries(page: number = 1, per_page: number = 50) {
		return this.client.get(
			"/sepa/beneficiaries",
			QontoSepaBeneficiaryListSchema,
			{
				page,
				per_page,
			},
		);
	}
}
