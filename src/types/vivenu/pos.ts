export interface PosDevice {
	_id: string;
	sellerId: string;
	active: boolean;
	name: string;
	posNo: string;
	printingType: "EXTERNAL";
	restrictions: {
		restrictXReportAccess: boolean;
		restrictZReportAccess: boolean;
		restrictDashboardAccess: boolean;
		restrictInstantCancellation: boolean;
		code: string;
		restrictEventAccess: boolean;
		restrictPurchaseIntents: boolean;
		restrictCustomerAccess: boolean;
		allowedEvents: string[];
	};
	signature: {
		fiskaly: {
			tssId: string;
			clientId: string;
			state: "UNINITIALIZED" | "INITIALIZED" | "ACTIVE" | "INACTIVE";
		};
	};
	state: "disabled" | "enabled";
	createdAt: string;
	updatedAt: string;
}
