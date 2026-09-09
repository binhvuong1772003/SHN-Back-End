"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffScheduleMcpTool = void 0;
const common_validate_1 = require("../../../validation/common.validate");
const staff_service_1 = require("../../../service/staff/staff.service");
const inputSchema = {
    staffId: common_validate_1.objectIdSchema
        .describe('ShopStaff ID of the staff member to get the schedule for.'),
    date: common_validate_1.dateOnlySchema
        .optional()
        .describe('Date formatted as YYYY-MM-DD. Omit for today.'),
};
exports.getStaffScheduleMcpTool = {
    name: 'get_staff_schedule',
    description: "Get a specific staff member's work schedule.",
    access: 'SHOP_READ',
    mode: 'read',
    inputSchema,
    execute: async (input, context) => (0, staff_service_1.getStaffScheduleByDateService)(context.shopSlug, input.staffId, input.date ?? context.currentDate),
};
