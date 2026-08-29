"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("@/utils/ApiError");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            if (schema.body) {
                console.log('body nhận được:', req.body); // ← thêm
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = (await schema.query.parseAsync(req.query));
            }
            if (schema.params) {
                req.params = (await schema.params.parseAsync(req.params));
            }
            if (schema.headers)
                await schema.headers.parseAsync(req.headers);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                console.log('Zod errors:', JSON.stringify(error.issues, null, 2));
                const issues = error.issues ??
                    error.errors ??
                    [];
                const messages = issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(new ApiError_1.ApiError(400, 'Validation Error', messages));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
