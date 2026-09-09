"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAttendanceMcpTool = void 0;
const common_validate_1 = require("../../../validation/common.validate");
const attendance_service_1 = require("../../../service/staff/attendance.service");
const zod_1 = require("zod");
const inputSchema = {
    from: common_validate_1.dateOnlySchema.optional().describe("Start date, YYYY-MM-DD."),
    to: common_validate_1.dateOnlySchema.optional().describe("End date, YYYY-MM-DD."),
    page: zod_1.z.coerce.number().int().min(1).max(100).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
};
exports.getMyAttendanceMcpTool = {
    name: "get_my_attendance",
    description: "Get the authenticated staff member's attendance history. Use from/to for a date range, or omit them for the current month.",
    access: "SELF_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const result = await (0, attendance_service_1.getMyAttendanceHistoryService)(context.shopSlug, context.userId, input);
        return {
            items: result.items.map((item) => ({
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
