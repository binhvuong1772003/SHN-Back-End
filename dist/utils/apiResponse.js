"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data = null, options = {}) => {
    const { statusCode = 200, message, meta } = options;
    return res.status(statusCode).json({
        success: true,
        data,
        ...(message ? { message } : {}),
        ...(meta !== undefined ? { meta } : {}),
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, statusCode, message, options = {}) => {
    const { code = "API_ERROR", details = null, requestId } = options;
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details,
            ...(requestId ? { requestId } : {}),
        },
    });
};
exports.sendError = sendError;
