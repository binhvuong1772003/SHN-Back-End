"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findStaffMcpTool = void 0;
const zod_1 = require("zod");
const staff_search_service_1 = require("../../../service/staff/staff-search.service");
const inputSchema = {
    staffName: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(100)
        .describe('Name or nickname of the staff member to search for.'),
};
exports.findStaffMcpTool = {
    name: 'find_staff',
    description: 'Find active staff members in the current shop by name or nickname. Returns matching staff members with their ShopStaff IDs. If multiple staff members match, return all candidates so the assistant can ask the user to clarify.',
    access: 'SHOP_READ',
    mode: 'read',
    inputSchema,
    execute: async (input, context) => (0, staff_search_service_1.findStaffByNameService)(context.shopSlug, input.staffName),
};
