"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustAttendanceSchema = exports.shopAttendanceQuerySchema = exports.myAttendanceHistorySchema = exports.manualAttendanceSchema = exports.attendanceQrSchema = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("@/validation/common.validate");
exports.attendanceQrSchema = zod_1.z.object({
    qrToken: zod_1.z.string().trim().min(1, "QR token is required"),
});
exports.manualAttendanceSchema = zod_1.z.object({
    staffId: common_validate_1.objectIdSchema,
    action: zod_1.z.enum(["CHECK_IN", "CHECK_OUT"]),
    reason: zod_1.z.string().trim().min(3).max(500),
});
exports.myAttendanceHistorySchema = common_validate_1.dateRangeSchema.merge(common_validate_1.paginationSchema);
exports.shopAttendanceQuerySchema = exports.myAttendanceHistorySchema.merge(zod_1.z.object({
    date: common_validate_1.dateOnlySchema.optional(),
    staffId: common_validate_1.objectIdSchema.optional(),
}));
exports.adjustAttendanceSchema = zod_1.z.object({
    checkIn: zod_1.z.coerce.date().optional().nullable(),
    checkOut: zod_1.z.coerce.date().optional().nullable(),
    status: zod_1.z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "DAY_OFF_APPROVED"]).optional(),
    note: zod_1.z.string().max(500).optional().nullable(),
    reason: zod_1.z.string().trim().min(3).max(500),
}).refine((data) => data.checkIn !== undefined || data.checkOut !== undefined || data.status !== undefined || data.note !== undefined, { message: "At least one attendance field is required for update" });
