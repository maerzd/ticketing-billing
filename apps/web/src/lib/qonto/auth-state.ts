import type { QueryErrorCode } from "@/lib/qonto/queries";

export function requiresQontoAuth(
	errorCode: QueryErrorCode | undefined,
): boolean {
	return errorCode === "UNAUTHORIZED";
}
