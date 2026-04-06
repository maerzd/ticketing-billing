export interface AccessUser {
	_id?: string; // Unique identifier for the access control entry
	sellerId: string; // Required: The ID of the seller that owns the access user
	active?: boolean; // Indicates if the access user is active
	name: string; // Required: An internal name to identify the access user
	token: string; // Required: The token to authenticate against the access-control endpoints
	accessAllEvents: boolean; // Required: Whether the access user can access all events of his seller
	events?: string[]; // List of specific events the access user can access, only if accessAllEvents=false
	lastRequest?: string; // Timestamp of the last request made by the access user
	expires?: string; // Expiration timestamp for the access user
	isIntegration?: boolean; // Indicates if the access user is for integration purposes
	integration?: string; // Details about the integration, if applicable
	deviceSettings?: {
		accessMode?: "restricted" | "fullrestricted"; // Optional: Mode of access
		scanGroupId?: string; // Optional: The ID of the scan group to which the access user is assigned
		[key: string]: unknown; // Additional settings related to the device
	}; // Settings related to the device used by the access user
	createdAt: string; // Required: ISO Timestamp indicating when the access user was created
	updatedAt: string; // Required: ISO Timestamp indicating when the access user was updated
	__v?: number; // Version key for the document
}
