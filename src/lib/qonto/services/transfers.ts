import { z } from "zod";
import type { QontoClient } from "@/lib/qonto/client";
import {
	QontoExternalTransferSchema,
	QontoVerifyPayeeResponseSchema,
} from "@/types/qonto";

import { QontoListSepaTransfersSchema } from "@/types/sepa-transfers";

const CreateTransferSchema = z.object({
	beneficiary_id: z.string().min(1),
	amount_in_cents: z.number().int().positive(),
	label: z.string().min(1),
	reference: z.string().optional(),
	vop_proof_token: z.string().min(1),
	bank_account_id: z.string().min(1),
});

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;

export class TransfersService {
	constructor(private readonly client: QontoClient) {}

	async verifyPayee(iban: string, beneficiary_name: string) {
		return this.client.post(
			"/sepa/verify_payee",
			QontoVerifyPayeeResponseSchema,
			{
				iban,
				beneficiary_name,
			},
		);
	}

	async createTransfer(input: CreateTransferInput) {
		const validated = CreateTransferSchema.parse(input);

		const headers: Record<string, string> = {
			"X-Qonto-Idempotency-Key": crypto.randomUUID(),
		};

		if (process.env.QONTO_SANDBOX) {
			headers["X-Qonto-2fa-Preference"] = "mock";
		}

		const bankAccountId = validated.bank_account_id;

		return this.client
			.post(
				"/sepa/transfers",
				z.object({ transfer: QontoExternalTransferSchema }),
				{
					vop_proof_token: validated.vop_proof_token,
					transfer: {
						beneficiary_id: validated.beneficiary_id,
						amount: (validated.amount_in_cents / 100).toFixed(2),
						reference: validated.reference || validated.label,
						note: validated.label,
						bank_account_id: bankAccountId,
					},
				},
				headers,
			)
			.then((result) => result.transfer);
	}

	async listTransfers(page: number = 1, per_page: number = 25) {
		return this.client.get("/sepa/transfers", QontoListSepaTransfersSchema, {
			page,
			per_page,
		});
	}
}
