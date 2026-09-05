import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { canUseMcpTool } from "../policies/policy-checker";
import type { McpContext } from "../types/mcp-context";
import type { McpToolRegistry } from "../types/tool";
import { getMyScheduleMcpTool } from "../tools/staff/get-my-schedule.tool";
import { getStaffScheduleMcpTool } from "../tools/staff/get-staff-schedule.tool";
import { findStaffMcpTool } from "../tools/staff/find-staff.tool";

export const mcpToolRegistry: McpToolRegistry = [
  getMyScheduleMcpTool,
  getStaffScheduleMcpTool,
  findStaffMcpTool,
];

export const registerMcpTools = (
  server: McpServer,
  context: McpContext,
): void => {
  for (const definition of mcpToolRegistry) {
    if (!canUseMcpTool(context, definition.access)) continue;

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
        } catch {
          return {
            isError: true,
            content: [{ type: "text" as const, text: "Tool execution failed" }],
          };
        }
      },
    );
  }
};
