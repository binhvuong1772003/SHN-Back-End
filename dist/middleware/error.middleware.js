"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
const apiResponse_1 = require("../utils/apiResponse");
const notFoundHandler = (req, res) => {
    return (0, apiResponse_1.sendError)(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, {
        code: "ROUTE_NOT_FOUND",
    });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, req, res, next) => {
    const requestId = req.headers["x-request-id"];
    if (res.headersSent) {
        return next(error);
    }
    if (error instanceof ApiError_1.ApiError) {
        return (0, apiResponse_1.sendError)(res, error.statusCode, error.message, {
            code: error.code,
            details: error.errors ?? null,
            requestId,
        });
    }
    if (error instanceof zod_1.ZodError) {
        return (0, apiResponse_1.sendError)(res, 422, "Invalid request data", {
            code: "VALIDATION_ERROR",
            details: error.flatten(),
            requestId,
        });
    }
    console.error("Unhandled error", error);
    return (0, apiResponse_1.sendError)(res, 500, "Internal server error", {
        code: "INTERNAL_SERVER_ERROR",
        requestId,
    });
};
exports.errorHandler = errorHandler;
