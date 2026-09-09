import { getMyPayrollsService } from "@/service/payroll/payroll.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

interface GetMyPayrollOutput {
  items: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    grossAmount: number;
    netAmount: number;
    commissionTotal: number;
    bonusTotal: number;
    deductions: number;
  }>;
}

export const getMyPayrollMcpTool: McpToolDefinition<
  object,
  GetMyPayrollOutput
> = {
  name: "get_my_payroll",
  description:
    "Get the authenticated staff member's confirmed or paid payroll records, including gross, net, bonuses, commissions, and deductions.",
  access: "SELF_READ",
  mode: "read",
  inputSchema: {},
  execute: async (_input, context) => {
    const payrolls = await getMyPayrollsService(context.shopSlug, context.userId);

    return {
      items: payrolls.map((payroll) => ({
        id: payroll.id,
        periodStart: payroll.periodStart.toISOString(),
        periodEnd: payroll.periodEnd.toISOString(),
        status: payroll.status,
        grossAmount: payroll.grossAmount,
        netAmount: payroll.netAmount,
        commissionTotal: payroll.commissionTotal,
        bonusTotal: payroll.bonusTotal,
        deductions:
          payroll.penaltyTotal +
          payroll.advanceDeduction +
          payroll.otherDeductions,
      })),
    };
  },
};
