import type { ErrorCode } from "@assertquest/shared";

export class ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: unknown;

  constructor(code: ErrorCode, statusCode: number, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError("UNAUTHORIZED", 401, message);
  }

  static tokenExpired(message = "Access token has expired") {
    return new ApiError("TOKEN_EXPIRED", 401, message);
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new ApiError("FORBIDDEN", 403, message);
  }

  static validation(message: string, details?: unknown) {
    return new ApiError("VALIDATION_ERROR", 400, message, details);
  }

  static conflict(message: string) {
    return new ApiError("CONFLICT", 409, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError("NOT_FOUND", 404, message);
  }
}
