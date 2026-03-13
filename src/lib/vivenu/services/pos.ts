import type { VivenuClient } from "@/lib/vivenu/client";
import type {
	FetchPosOptions,
	PosDevice,
	PosRevenueResponse,
} from "@/lib/vivenu/types";

export class VivenuPosService {
	constructor(private readonly client: VivenuClient) {}

	async fetchMonthlyPOSRevenue(
		posId: string,
	): Promise<PosRevenueResponse | null> {
		try {
			return await this.client.hubblePost<PosRevenueResponse>(
				"/analytics/transactions/revenue",
				{
					filter: [
						{
							$and: [
								{
									type: "date",
									value: "2025-01-01T00:00:00.000Z",
									operator: "gte",
									key: "createdAt",
								},
								{
									type: "date",
									value: new Date().toISOString(),
									operator: "lte",
									key: "createdAt",
								},
								{
									type: "string",
									value: posId,
									operator: "eq",
									key: "posId",
								},
							],
						},
					],
					dimensions: ["itemType"],
					groupBy: "month:createdAt",
					aggregateConfig: { weekStart: 1, timeZone: "Europe/Berlin" },
				},
			);
		} catch (error) {
			console.error("[VIVENU] fetchMonthlyPOSRevenue error:", error);
			return null;
		}
	}

	async fetchAllPOS(options?: FetchPosOptions): Promise<PosDevice[] | null> {
		try {
			const queryParams: Record<string, string> = {};

			if (options?.sellerId) {
				queryParams.sellerId = options.sellerId;
			}

			return await this.client.apiGet<PosDevice[]>("/pos", queryParams);
		} catch (error) {
			console.error("[VIVENU] fetchAllPOS error:", error);
			return null;
		}
	}

	async fetchPOS(posId: string | undefined): Promise<PosDevice | null> {
		if (!posId) return null;

		try {
			return await this.client.apiGet<PosDevice>(`/pos/${posId}`);
		} catch (error) {
			console.error("[VIVENU] fetchPOS error:", error);
			return null;
		}
	}
}
