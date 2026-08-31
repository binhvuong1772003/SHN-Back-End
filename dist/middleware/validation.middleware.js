"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
const validate = (schema) => {
    return async (req, _res, next) => {
        const targets = typeof schema.parseAsync === "function"
            ? { body: schema }
            : schema;
        try {
            if (targets.body)
                req.body = await targets.body.parseAsync(req.body);
            if (targets.query) {
                const validatedQuery = await targets.query.parseAsync(req.query);
                Object.defineProperty(req, "query", {
                    value: validatedQuery,
                    configurable: true,
                    enumerable: true,
                    writable: true,
                });
            }
            if (targets.params) {
                const validatedParams = await targets.params.parseAsync(req.params);
                req.params = { ...req.params, ...validatedParams };
            }
            if (targets.headers)
                await targets.headers.parseAsync(req.headers);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                return next(new ApiError_1.ApiError(422, "Invalid request data", details, "VALIDATION_ERROR"));
            }
            return next(error);
        }
    };
};
exports.validate = validate;
