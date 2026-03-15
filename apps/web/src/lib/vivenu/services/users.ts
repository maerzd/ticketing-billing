import type { VivenuClient } from "@/lib/vivenu/client";
import type {
	AccessUser,
	InviteUserPayload,
	InviteUserResult,
	UsersResponse,
} from "@/lib/vivenu/types";
import type { Me } from "@/types/vivenu/me";

export class VivenuUsersService {
	constructor(private readonly client: VivenuClient) {}

	async fetchMe(): Promise<Me | null> {
		try {
			return await this.client.apiGet<Me>("/sellers/me");
		} catch (error) {
			console.error("[VIVENU] fetchMe error:", error);
			return null;
		}
	}

	async fetchAccessUser(orgId: string): Promise<AccessUser | null> {
		if (!orgId) return null;

		try {
			const users = await this.client.apiGet<AccessUser[]>("/accessusers");
			return (
				users.find((accessControl) => accessControl.name === orgId) || null
			);
		} catch (error) {
			console.error("[VIVENU] fetchAccessUser error:", error);
			return null;
		}
	}

	async inviteUser(payload: InviteUserPayload): Promise<InviteUserResult> {
		try {
			const data = await this.client.apiPost<{ _id: string }>(
				"/users/invite",
				payload,
			);

			return { success: true, data };
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Fehler beim Einladen des Benutzers";

			console.error("[VIVENU] inviteUser error:", error);
			return { success: false, error: errorMessage };
		}
	}

	async fetchUsers(
		top: number = 50,
		skip: number = 0,
	): Promise<UsersResponse | null> {
		try {
			return await this.client.apiGet<UsersResponse>("/users/rich", {
				top: String(top),
				skip: String(skip),
			});
		} catch (error) {
			console.error("[VIVENU] fetchUsers error:", error);
			return null;
		}
	}
}
