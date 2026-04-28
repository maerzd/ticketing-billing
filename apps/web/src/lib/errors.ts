interface QontoOAuthError {
	error: string;
	error_description?: string;
}

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
