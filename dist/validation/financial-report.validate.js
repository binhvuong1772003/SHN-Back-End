"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialReportQuerySchema = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("@/validation/common.validate");
exports.financialReportQuerySchema = zod_1.z
    .object({
    periodStart: common_validate_1.dateOnlySchema,
    periodEnd: common_validate_1.dateOnlySchema,
})
    .refine((value) => value.periodStart <= value.periodEnd, {
    message: "Start date must be before or equal to end date",
    path: ["periodEnd"],
});
