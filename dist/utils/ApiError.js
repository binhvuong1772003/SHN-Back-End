"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
// utils/api-error.ts
class ApiError extends Error {
    constructor(statusCode, message, errors, code = "API_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
