import type { QontoAPIError, QontoOAuthError } from "@/types/qonto/qonto";

export class AppError extends Error {
	public readonly statusCode: number;

	constructor(message: string, statusCode: number = 500) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
	}
}

export class OAuthError extends AppError {
	public readonly code?: string;
	public readonly description?: string;

	constructor(message: string, error?: QontoOAuthError) {
		super(message, 400);
		this.name = "OAuthError";
		this.code = error?.error;
		this.description = error?.error_description;
	}
}

export class QontoAPIErrorHandler extends AppError {
	public readonly apiErrors: QontoAPIError["errors"];

	constructor(message: string, errors?: QontoAPIError["errors"]) {
		super(message, 400);
		this.name = "QontoAPIError";
		this.apiErrors = errors || [];
	}

	static fromAPIResponse(
		errors: QontoAPIError["errors"],
	): QontoAPIErrorHandler {
		const message = errors[0]?.detail || "Unknown Qonto API error";
		return new QontoAPIErrorHandler(message, errors);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string = "Unauthorized") {
		super(message, 401);
		this.name = "UnauthorizedError";
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
		this.name = "ValidationError";
	}
}
