import { getPayrollListService } from "@/service/payroll/payroll.service";
import { objectIdSchema, dateOnlySchema } from "@/validation/common.validate";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";
import { z } from "zod";

const inputSchema = {
  staffId: objectIdSchema.describe("ShopStaff ID of the staff member."),
  periodStart: dateOnlySchema.optional(),
  periodEnd: dateOnlySchema.optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "PAID"]).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};

type GetStaffPayrollInput = {
  staffId: string;
  periodStart?: string;
  periodEnd?: string;
  status?: "DRAFT" | "CONFIRMED" | "PAID";
  page?: number;
  limit?: number;
};

interface PayrollItem {
  id: string;
  staffId: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  grossAmount: number;
  netAmount: number;
  commissionTotal: number;
  bonusTotal: number;
  deductions: number;
}

interface GetStaffPayrollOutput {
  items: PayrollItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getStaffPayrollMcpTool: McpToolDefinition<
  GetStaffPayrollInput,
  GetStaffPayrollOutput
> = {
  name: "get_staff_payroll",
  description:
    "Get compact payroll records for a specific staff member in the current shop. Use staffId from get_staff_list or find_staff.",
  access: "PAYROLL_READ_ALL",
  mode: "read",
  inputSchema,
  execute: async (input, context) => {
    const result = await getPayrollListService(context.shopSlug, input);

    return {
      items: result.items.map((payroll) => ({
        id: payroll.id,
        staffId: payroll.staffId,
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
      meta: result.meta,
    };
  },
};
