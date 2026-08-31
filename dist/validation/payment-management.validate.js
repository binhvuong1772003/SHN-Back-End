"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentDetailParamsSchema = exports.paymentListQuerySchema = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../validation/common.validate");
exports.paymentListQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    from: common_validate_1.dateOnlySchema.optional(),
    to: common_validate_1.dateOnlySchema.optional(),
    status: zod_1.z.enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"]).optional(),
    method: zod_1.z.enum(["CASH", "MOMO", "VNPAY", "ZALO_PAY", "CARD", "TRANSFER"]).optional(),
    search: zod_1.z.string().trim().max(100).optional(),
})
    .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must be before or equal to end date",
    path: ["to"],
});
exports.paymentDetailParamsSchema = zod_1.z.object({
    paymentId: common_validate_1.objectIdSchema,
});
