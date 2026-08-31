"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offDayListQuerySchema = exports.calendarMonthQuerySchema = exports.calendarSlotsListQuerySchema = exports.calendarDateQuerySchema = exports.calendarSlotsQuerySchema = exports.topCustomerQuerySchema = exports.notificationListQuerySchema = exports.staffListQuerySchema = exports.idParamSchema = exports.dateRangeSchema = exports.paginationSchema = exports.dateOnlySchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");
exports.dateOnlySchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
    .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid date");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).max(10000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.dateRangeSchema = zod_1.z.object({
    from: exports.dateOnlySchema.optional(),
    to: exports.dateOnlySchema.optional(),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must be before or equal to end date",
    path: ["to"],
});
const idParamSchema = (key) => zod_1.z.object({ [key]: exports.objectIdSchema });
exports.idParamSchema = idParamSchema;
exports.staffListQuerySchema = exports.paginationSchema.extend({
    search: zod_1.z.string().trim().max(100).optional(),
    role: zod_1.z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
    sort: zod_1.z.enum(["RECENT", "NAME_ASC", "NAME_DESC", "REVENUE"]).optional(),
});
exports.notificationListQuerySchema = exports.paginationSchema;
exports.topCustomerQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(5),
});
exports.calendarSlotsQuerySchema = zod_1.z.object({
    date: exports.dateOnlySchema,
    durationMin: zod_1.z.coerce.number().int().min(15).max(1440),
    staffId: exports.objectIdSchema.optional(),
});
exports.calendarDateQuerySchema = zod_1.z.object({
    date: exports.dateOnlySchema,
});
exports.calendarSlotsListQuerySchema = exports.calendarDateQuerySchema.extend({
    durationMin: zod_1.z.coerce.number().int().min(15).max(1440),
});
exports.calendarMonthQuerySchema = zod_1.z.object({
    year: zod_1.z.coerce.number().int().min(2000).max(2100),
    month: zod_1.z.coerce.number().int().min(1).max(12),
    staffId: exports.objectIdSchema.optional(),
});
exports.offDayListQuerySchema = exports.paginationSchema.extend({
    assignedToMe: zod_1.z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    staffId: exports.objectIdSchema.optional(),
});
