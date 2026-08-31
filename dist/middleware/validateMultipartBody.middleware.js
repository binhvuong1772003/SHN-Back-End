"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMultipartBody = void 0;
const apiResponse_1 = require("@/utils/apiResponse");
const validateMultipartBody = (schema) => {
    return (req, res, next) => {
        let payload;
        try {
            payload = JSON.parse(req.body.data);
        }
        catch {
            return (0, apiResponse_1.sendError)(res, 400, "Invalid request data", { code: "VALIDATION_ERROR" });
        }
        if (req.body.imageUrl)
            payload.imageUrl = req.body.imageUrl;
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return (0, apiResponse_1.sendError)(res, 422, "Invalid request data", {
                code: "VALIDATION_ERROR",
                details: parsed.error.flatten(),
            });
        }
        req.body = parsed.data;
        next();
    };
};
exports.validateMultipartBody = validateMultipartBody;
