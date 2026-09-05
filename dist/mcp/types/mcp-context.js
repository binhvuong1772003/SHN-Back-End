"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpContextSchema = void 0;
const zod_1 = require("zod");
exports.mcpContextSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    shopId: zod_1.z.string().min(1),
    shopSlug: zod_1.z.string().min(1),
    role: zod_1.z.enum(["STAFF", "MANAGER", "OWNER"]),
    permissions: zod_1.z.array(zod_1.z.string()),
    currentDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    requestId: zod_1.z.string().min(1).optional(),
    timezone: zod_1.z.string().min(1),
});
