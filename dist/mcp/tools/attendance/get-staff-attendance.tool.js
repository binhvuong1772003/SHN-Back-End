"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffAttendanceMcpTool = void 0;
const common_validate_1 = require("../../../validation/common.validate");
const attendance_service_1 = require("../../../service/staff/attendance.service");
const zod_1 = require("zod");
const inputSchema = {
    staffId: common_validate_1.objectIdSchema.describe("ShopStaff ID of the staff member."),
    date: common_validate_1.dateOnlySchema.optional().describe("Specific date, YYYY-MM-DD."),
    from: common_validate_1.dateOnlySchema.optional().describe("Start date, YYYY-MM-DD."),
    to: common_validate_1.dateOnlySchema.optional().describe("End date, YYYY-MM-DD."),
    page: zod_1.z.coerce.number().int().min(1).max(100).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
};
exports.getStaffAttendanceMcpTool = {
    name: "get_staff_attendance",
    description: "Get compact attendance records for a specific staff member in the current shop. Use staffId from get_staff_list or find_staff.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const result = await (0, attendance_service_1.getShopAttendanceService)(context.shopSlug, input);
        return {
            items: result.items.map((item) => ({
                attendanceId: item.id,
                staffId: item.shopStaffId,
                staffName: item.shopStaff.user.name,
                date: item.date.toISOString(),
                checkIn: item.checkIn?.toISOString() ?? null,
                checkOut: item.checkOut?.toISOString() ?? null,
                status: item.status,
                lateMinutes: item.lateMinutes,
                workMinutes: item.workMinutes,
            })),
            meta: result.meta,
        };
    },
};
