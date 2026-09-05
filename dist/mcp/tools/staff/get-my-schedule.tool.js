"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyScheduleMcpTool = void 0;
const zod_1 = require("zod");
const staff_service_1 = require("../../../service/staff/staff.service");
const inputSchema = {
    date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
        .optional()
        .describe("Date formatted as YYYY-MM-DD. Omit for today."),
};
exports.getMyScheduleMcpTool = {
    name: "get_my_schedule",
    description: "Get the authenticated staff member's work schedule. Omit date for today; provide YYYY-MM-DD for another date.",
    access: "SELF_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => (0, staff_service_1.getMyStaffScheduleByDateService)(context.shopSlug, context.userId, input.date ?? context.currentDate),
};
