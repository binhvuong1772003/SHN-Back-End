"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyScheduleTool = void 0;
const agents_1 = require("@openai/agents");
const zod_1 = require("zod");
const staff_service_1 = require("../../service/staff/staff.service");
const getMyScheduleParameters = zod_1.z.object({
    date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
        .describe("Date formatted as YYYY-MM-DD"),
});
exports.getMyScheduleTool = (0, agents_1.tool)({
    name: "get_my_schedule",
    description: "Get the authenticated staff member's work schedule for a specific date.",
    parameters: getMyScheduleParameters,
    execute: async ({ date }, runContext) => {
        if (!runContext)
            throw new Error("Salon agent context is required");
        const { userId, shopSlug } = runContext.context;
        return (0, staff_service_1.getMyStaffScheduleByDateService)(shopSlug, userId, date);
    },
});
