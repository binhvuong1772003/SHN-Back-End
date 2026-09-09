"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMcpTools = exports.mcpToolRegistry = void 0;
const policy_checker_1 = require("../policies/policy-checker");
const get_my_schedule_tool_1 = require("../tools/staff/get-my-schedule.tool");
const get_staff_schedule_tool_1 = require("../tools/staff/get-staff-schedule.tool");
const find_staff_tool_1 = require("../tools/staff/find-staff.tool");
const get_staff_list_tool_1 = require("../tools/staff/get-staff-list.tool");
const get_service_list_tool_1 = require("../tools/service/get-service-list.tool");
const find_customer_tool_1 = require("../tools/customer/find-customer.tool");
const get_customer_list_tool_1 = require("../tools/customer/get-customer-list.tool");
const get_appointment_list_tool_1 = require("../tools/appointment/get-appointment-list.tool");
const get_my_available_slots_tool_1 = require("../tools/appointment/get-my-available-slots.tool");
const get_staff_available_slots_tool_1 = require("../tools/appointment/get-staff-available-slots.tool");
const create_appointment_tool_1 = require("../tools/appointment/create-appointment.tool");
const update_appointment_tool_1 = require("../tools/appointment/update-appointment.tool");
const cancel_appointment_tool_1 = require("../tools/appointment/cancel-appointment.tool");
const request_off_day_tool_1 = require("../tools/staff/request-off-day.tool");
const get_my_attendance_tool_1 = require("../tools/attendance/get-my-attendance.tool");
const get_staff_attendance_tool_1 = require("../tools/attendance/get-staff-attendance.tool");
const get_my_payroll_tool_1 = require("../tools/payroll/get-my-payroll.tool");
const get_staff_payroll_tool_1 = require("../tools/payroll/get-staff-payroll.tool");
const get_shop_hours_tool_1 = require("../tools/shop/get-shop-hours.tool");
const get_financial_summary_tool_1 = require("../tools/financial/get-financial-summary.tool");
const get_revenue_summary_tool_1 = require("../tools/financial/get-revenue-summary.tool");
exports.mcpToolRegistry = [
    get_my_schedule_tool_1.getMyScheduleMcpTool,
    get_staff_schedule_tool_1.getStaffScheduleMcpTool,
    find_staff_tool_1.findStaffMcpTool,
    get_staff_list_tool_1.getStaffListMcpTool,
    get_service_list_tool_1.getServiceListMcpTool,
    find_customer_tool_1.findCustomerMcpTool,
    get_customer_list_tool_1.getCustomerListMcpTool,
    get_appointment_list_tool_1.getStaffAppointmentsMcpTool,
    get_my_available_slots_tool_1.getMyAvailableSlotsMcpTool,
    get_staff_available_slots_tool_1.getStaffAvailableSlotsMcpTool,
    create_appointment_tool_1.createAppointmentMcpTool,
    update_appointment_tool_1.updateAppointmentMcpTool,
    cancel_appointment_tool_1.cancelAppointmentMcpTool,
    request_off_day_tool_1.requestOffDayMcpTool,
    get_my_attendance_tool_1.getMyAttendanceMcpTool,
    get_staff_attendance_tool_1.getStaffAttendanceMcpTool,
    get_my_payroll_tool_1.getMyPayrollMcpTool,
    get_staff_payroll_tool_1.getStaffPayrollMcpTool,
    get_shop_hours_tool_1.getShopHoursMcpTool,
    get_financial_summary_tool_1.getFinancialSummaryMcpTool,
    get_revenue_summary_tool_1.getRevenueSummaryMcpTool,
];
const registerMcpTools = (server, context) => {
    for (const definition of exports.mcpToolRegistry) {
        if (!(0, policy_checker_1.canUseMcpTool)(context, definition.access)) {
            if (definition.mode === "write") {
                console.warn("[MCP] Write tool not registered for current role", {
                    tool: definition.name,
                    role: context.role,
                    access: definition.access,
                    requestId: context.requestId,
                });
            }
            continue;
        }
        server.registerTool(definition.name, {
            description: definition.description,
            inputSchema: definition.inputSchema,
            annotations: {
                readOnlyHint: definition.mode === "read",
                destructiveHint: definition.mode === "write",
            },
        }, async (input) => {
            try {
                const output = await definition.execute(input, context);
                return {
                    content: [{ type: "text", text: JSON.stringify(output) }],
                };
            }
            catch (error) {
                console.error("[MCP] Tool execution failed", {
                    tool: definition.name,
                    requestId: context.requestId,
                    error: error instanceof Error ? (error.stack ?? error.message) : error,
                });
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: error instanceof Error
                                ? error.message
                                : "Tool execution failed",
                        },
                    ],
                };
            }
        });
    }
};
exports.registerMcpTools = registerMcpTools;
