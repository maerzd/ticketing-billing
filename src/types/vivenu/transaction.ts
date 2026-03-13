interface TaxItem {
	rate: number;
	perUnit: number;
	netPerUnit: number;
	netTotal: number;
	total: number;
}

interface FeeComponent {
	amount: number;
	value: number;
	total: number;
	type: string;
	_id: string;
	netTotal?: number;
	taxInfo?: {
		taxItems: TaxItem[];
	};
}

interface Ticket {
	_id: string;
	type: string;
	name: string;
	amount: number;
	price: number;
	netPrice: number;
	taxRate: number;
	ticketTypeId: string;
	categoryRef: string;
	asHardTicket: boolean;
	taxInfo: {
		taxItems: TaxItem[];
	};
}

interface AppliedDiscountItem {
	itemId: string;
	cartItemId: string;
	amount: number;
	regularPrice: number;
	price: number;
	varDiscounts: any[];
	fixDiscounts: any[];
	components: any[];
	_id: string;
}

interface AppliedDiscountInfo {
	items: AppliedDiscountItem[];
	discounts: any[];
	_id: string;
}

interface HistoryEntry {
	type: string;
	date: string;
	risk: string;
	_id: string;
}

interface Split {
	type: string;
	reference: string;
	amount: number;
	method: string;
	gateway: string;
	gatewayId: string;
}

interface PaymentInfo {
	psp: string;
	gateway: string;
	gatewayId: string;
	providerType: string;
	method: string;
	_id: string;
}

interface IpLookup {
	ip: string;
	lookup: {
		range: string;
		country: string;
		region: string;
		city: string;
		ll: [number, number];
		metro: number;
		area: number;
		eu: string;
		timezone: string;
	};
}

interface Transaction {
	_id: string;
	sellerId: string;
	customerId: string;
	eventId: string;
	company: string;
	name: string;
	prename: string;
	lastname: string;
	email: string;
	street: string;
	city: string;
	country: string;
	postal: string;
	tickets: Ticket[];
	products: any[];
	additionalItems: any[];
	currency: string;
	regularPrice: number;
	realPrice: number;
	paymentCharge: number;
	innerCharge: number;
	outerCharge: number;
	innerFeeComponents: {
		fix: FeeComponent[];
		var: FeeComponent[];
	};
	outerFeeComponents: {
		fix: FeeComponent[];
		var: FeeComponent[];
	};
	taxRate: number;
	paymentStatus: string;
	status: string;
	origin: string;
	salesChannelId: string;
	ipLookup: IpLookup;
	locationCenter: [number, number];
	secret: string;
	vouchers: any[];
	redeemedVouchers: {
		totalRedeemedAmount: number;
		vouchers: any[];
	};
	appliedCoupons: any[];
	appliedDiscountGroups: any[];
	preferredLanguage: string;
	appliedDiscountInfo: AppliedDiscountInfo;
	invoiceVersion: string;
	checkoutId: string;
	history: any[];
	historyEntries: HistoryEntry[];
	posDiscounts: any[];
	splits: Split[];
	paymentMethod: string;
	psp: string;
	paymentInfo: PaymentInfo;
	ticketMailSend: boolean;
	createdAt: string;
	updatedAt: string;
	__v: number;
}

export type { Transaction };
