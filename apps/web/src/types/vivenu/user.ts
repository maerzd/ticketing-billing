export interface Permission {
	type: string;
	scope?: string;
}

export interface Role {
	type: string;
	scope?: string;
}

export interface User {
	_id: string;
	email: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	isAdmin?: boolean;
	isSuperAdmin?: boolean;
	loginType?: string;
	sellerAccess?: string;
	sellers?: string[];
	granularPermissionsForSellers?: string[];
	permissions?: Permission[];
	roles?: Role[];
	sellerId?: string;
	status?: string;
	createdAt: string;
	updatedAt?: string;
	lastLogin?: string;
	organizationAccess?: string;
	preferredLanguage?: string;
	__v?: number;
	[key: string]: unknown;
}

export interface UsersResponse {
	docs: User[];
	total: number;
}
