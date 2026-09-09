"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAvailableSlotsMcpTool = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../../../validation/common.validate");
const calendar_service_1 = require("../../../service/calendar/calendar.service");
const inputSchema = {
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
exports.getMyAvailableSlotsMcpTool = {
    name: "get_my_available_slots",
    description: "Get available appointment slots for the authenticated staff member. Omit date for today and provide the appointment duration in minutes.",
    access: "SELF_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => (0, calendar_service_1.getAvailableSlotsForStaffUser)({
        shopSlug: context.shopSlug,
        userId: context.userId,
        date: input.date ?? context.currentDate,
        durationMin: input.durationMin,
    }),
};
