import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { canUseMcpTool } from "../policies/policy-checker";
import type { McpContext } from "../types/mcp-context";
import type { McpToolRegistry } from "../types/tool";
import { getMyScheduleMcpTool } from "../tools/staff/get-my-schedule.tool";
import { getStaffScheduleMcpTool } from "../tools/staff/get-staff-schedule.tool";
import { findStaffMcpTool } from "../tools/staff/find-staff.tool";
import { getStaffListMcpTool } from "../tools/staff/get-staff-list.tool";
import { getServiceListMcpTool } from "../tools/service/get-service-list.tool";
import { findCustomerMcpTool } from "../tools/customer/find-customer.tool";
import { getCustomerListMcpTool } from "../tools/customer/get-customer-list.tool";
import { getStaffAppointmentsMcpTool } from "../tools/appointment/get-appointment-list.tool";
import { getMyAvailableSlotsMcpTool } from "../tools/appointment/get-my-available-slots.tool";
import { getStaffAvailableSlotsMcpTool } from "../tools/appointment/get-staff-available-slots.tool";
import { createAppointmentMcpTool } from "../tools/appointment/create-appointment.tool";
import { updateAppointmentMcpTool } from "../tools/appointment/update-appointment.tool";
import { cancelAppointmentMcpTool } from "../tools/appointment/cancel-appointment.tool";
import { requestOffDayMcpTool } from "../tools/staff/request-off-day.tool";
import { getMyAttendanceMcpTool } from "../tools/attendance/get-my-attendance.tool";
import { getStaffAttendanceMcpTool } from "../tools/attendance/get-staff-attendance.tool";
import { getMyPayrollMcpTool } from "../tools/payroll/get-my-payroll.tool";
import { getStaffPayrollMcpTool } from "../tools/payroll/get-staff-payroll.tool";
import { getShopHoursMcpTool } from "../tools/shop/get-shop-hours.tool";
import { getFinancialSummaryMcpTool } from "../tools/financial/get-financial-summary.tool";
import { getRevenueSummaryMcpTool } from "../tools/financial/get-revenue-summary.tool";

export const mcpToolRegistry: McpToolRegistry = [
  getMyScheduleMcpTool,
  getStaffScheduleMcpTool,
  findStaffMcpTool,
  getStaffListMcpTool,
  getServiceListMcpTool,
  findCustomerMcpTool,
  getCustomerListMcpTool,
  getStaffAppointmentsMcpTool,
  getMyAvailableSlotsMcpTool,
  getStaffAvailableSlotsMcpTool,
  createAppointmentMcpTool,
  updateAppointmentMcpTool,
  cancelAppointmentMcpTool,
  requestOffDayMcpTool,
  getMyAttendanceMcpTool,
  getStaffAttendanceMcpTool,
  getMyPayrollMcpTool,
  getStaffPayrollMcpTool,
  getShopHoursMcpTool,
  getFinancialSummaryMcpTool,
  getRevenueSummaryMcpTool,
];

export const registerMcpTools = (
  server: McpServer,
  context: McpContext,
): void => {
  for (const definition of mcpToolRegistry) {
    if (!canUseMcpTool(context, definition.access)) {
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

    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema: definition.inputSchema,
        annotations: {
          readOnlyHint: definition.mode === "read",
          destructiveHint: definition.mode === "write",
        },
      },
      async (input: Record<string, unknown>) => {
        try {
          const output = await definition.execute(input as never, context);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(output) }],
          };
        } catch (error) {
          console.error("[MCP] Tool execution failed", {
            tool: definition.name,
            requestId: context.requestId,
            error:
              error instanceof Error ? (error.stack ?? error.message) : error,
          });
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text:
                  error instanceof Error
                    ? error.message
                    : "Tool execution failed",
              },
            ],
          };
        }
      },
    );
  }
};
