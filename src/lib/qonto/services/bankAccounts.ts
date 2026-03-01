import type { QontoClient } from "@/lib/qonto/client";
import { QontoBankAccountListSchema } from "@/types/qonto";

export class BankAccountsService {
	constructor(private readonly client: QontoClient) {}

	async listBankAccounts(page: number = 1, per_page: number = 50) {
		return this.client.get("/bank_accounts", QontoBankAccountListSchema, {
			page,
			per_page,
		});
	}
}
