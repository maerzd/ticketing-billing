const QONTO_AUTH_ERROR_SNIPPETS = [
	"No refresh token found",
	"Token refresh failed",
	"Unauthorized",
	"401",
];

export function requiresQontoAuth(errorMessage: string | undefined): boolean {
	if (!errorMessage) {
		return false;
	}

	return QONTO_AUTH_ERROR_SNIPPETS.some((snippet) =>
		errorMessage.includes(snippet),
	);
}
