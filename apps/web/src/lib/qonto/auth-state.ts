type QueryErrorCode = "UNAUTHORIZED" | "UNKNOWN";

export function requiresQontoAuth(
	errorCode: QueryErrorCode | undefined,
): boolean {
	return errorCode === "UNAUTHORIZED";
}
