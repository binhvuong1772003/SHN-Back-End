"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payPayrollSchema = exports.payrollAdjustmentSchema = exports.payrollListQuerySchema = exports.generatePayrollSchema = exports.serviceCommissionSchema = exports.salaryConfigSchema = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../validation/common.validate");
const dateSchema = common_validate_1.dateOnlySchema;
exports.salaryConfigSchema = zod_1.z
    .object({
    commissionType: zod_1.z
        .enum(["PERCENT", "FIXED_PER_SERVICE", "FIXED_PER_DAY", "SALARY"])
        .optional(),
    baseSalary: zod_1.z.number().min(0).optional(),
    salaryPeriod: zod_1.z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
    defaultCommissionPercent: zod_1.z.number().min(0).max(100).optional(),
    defaultFixedPerService: zod_1.z.number().min(0).optional(),
    bonusPerPositiveReview: zod_1.z.number().min(0).optional(),
    penaltyPerNoShow: zod_1.z.number().min(0).optional(),
    penaltyPerLateMinute: zod_1.z.number().min(0).optional(),
    otMultiplier: zod_1.z.number().min(0).optional(),
    effectiveFrom: zod_1.z.coerce.date().optional(),
    note: zod_1.z.string().max(500).optional().nullable(),
})
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one salary configuration field is required",
});
exports.serviceCommissionSchema = zod_1.z.object({
    commissionType: zod_1.z.enum(["PERCENT", "FIXED_PER_SERVICE"]),
    value: zod_1.z.number().min(0),
});
exports.generatePayrollSchema = zod_1.z
    .object({
    periodStart: dateSchema,
    periodEnd: dateSchema,
    staffIds: zod_1.z.array(common_validate_1.objectIdSchema).min(1).optional(),
})
    .refine((data) => data.periodStart <= data.periodEnd, {
    message: "Start date must be before or equal to end date",
    path: ["periodEnd"],
});
exports.payrollListQuerySchema = zod_1.z
    .object({
    periodStart: dateSchema.optional(),
    periodEnd: dateSchema.optional(),
    status: zod_1.z.enum(["DRAFT", "CONFIRMED", "PAID"]).optional(),
    staffId: common_validate_1.objectIdSchema.optional(),
}).merge(common_validate_1.paginationSchema)
    .refine((data) => !data.periodStart ||
    !data.periodEnd ||
    data.periodStart <= data.periodEnd, {
    message: "Start date must be before or equal to end date",
    path: ["periodEnd"],
});
exports.payrollAdjustmentSchema = zod_1.z.object({
    type: zod_1.z.enum(["BONUS", "DEDUCTION"]),
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().trim().min(3).max(500),
});
exports.payPayrollSchema = zod_1.z.object({
    paymentMethod: zod_1.z.enum([
        "CASH",
        "MOMO",
        "VNPAY",
        "ZALO_PAY",
        "CARD",
        "TRANSFER",
    ]),
    paymentNote: zod_1.z.string().max(500).optional(),
});
