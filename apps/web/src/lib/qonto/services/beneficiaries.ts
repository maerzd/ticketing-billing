import type { z } from "zod";
import type { QontoClient } from "@/lib/qonto/client";
import {
	QontoBeneficiaryIdsSchema,
	QontoCreateSepaBeneficiarySchema,
	QontoSepaBeneficiaryBatchResponseSchema,
	QontoSepaBeneficiaryListSchema,
	QontoSepaBeneficiaryResponseSchema,
} from "@/types/qonto/beneficiaries";

export type CreateBeneficiaryInput = z.infer<
	typeof QontoCreateSepaBeneficiarySchema
>;

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

	async createBeneficiary(input: CreateBeneficiaryInput) {
		const validated = QontoCreateSepaBeneficiarySchema.parse(input);
		const headers: Record<string, string> = {
			"X-Qonto-Idempotency-Key": crypto.randomUUID(),
		};

		return this.client
			.post(
				"/sepa/beneficiaries",
				QontoSepaBeneficiaryResponseSchema,
				{ beneficiary: validated },
				headers,
			)
			.then((response) => response.beneficiary);
	}

	async trustBeneficiaries(ids: string[]) {
		const validated = QontoBeneficiaryIdsSchema.parse({ ids });
		return this.client
			.patch(
				"/sepa/beneficiaries/trust",
				QontoSepaBeneficiaryBatchResponseSchema,
				validated,
			)
			.then((response) => response.beneficiaries);
	}

	async untrustBeneficiaries(ids: string[]) {
		const validated = QontoBeneficiaryIdsSchema.parse({ ids });
		return this.client
			.patch(
				"/sepa/beneficiaries/untrust",
				QontoSepaBeneficiaryBatchResponseSchema,
				validated,
			)
			.then((response) => response.beneficiaries);
	}
}
