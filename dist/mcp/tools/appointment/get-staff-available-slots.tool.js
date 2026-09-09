"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffAvailableSlotsMcpTool = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../../../validation/common.validate");
const calendar_service_1 = require("../../../service/calendar/calendar.service");
const inputSchema = {
    staffId: common_validate_1.objectIdSchema.describe("ShopStaff ID of the staff member."),
    date: common_validate_1.dateOnlySchema
        .optional()
        .describe("Date formatted as YYYY-MM-DD. Omit for today."),
    durationMin: zod_1.z.coerce
        .number()
        .int()
        .min(15)
        .max(480)
        .describe("Required appointment duration in minutes."),
};
exports.getStaffAvailableSlotsMcpTool = {
    name: "get_staff_available_slots",
    description: "Get available appointment slots for a specific staff member in the current shop. Use staffId from get_staff_list or find_staff.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => (0, calendar_service_1.getAvailableSlots)({
        shopSlug: context.shopSlug,
        staffId: input.staffId,
        date: input.date ?? context.currentDate,
        durationMin: input.durationMin,
    }),
};
