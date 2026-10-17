// utils/api-error.ts
export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;
  code: string;

  constructor(statusCode: number, message: string, errors?: unknown, code = "API_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}
