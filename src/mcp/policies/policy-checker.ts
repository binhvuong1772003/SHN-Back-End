import type { McpContext } from "../types/mcp-context";
import type { McpToolAccess } from "../types/tool";

export const canUseMcpTool = (
  context: McpContext,
  access: McpToolAccess,
): boolean => {
  if (access === "SELF_READ") return true;
  if (access === "SHOP_READ" || access === "FINANCE_READ") {
    return context.role === "MANAGER" || context.role === "OWNER";
  }
  if (access === "PAYROLL_READ_ALL") return context.role === "MANAGER" || context.role === "OWNER";
  return context.role === "OWNER";
};
