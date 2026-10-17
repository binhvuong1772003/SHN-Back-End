import { getFinancialReportService } from "@/service/financial-report/financial-report.service";
import { dateOnlySchema } from "@/validation/common.validate";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  periodStart: dateOnlySchema.optional(),
  periodEnd: dateOnlySchema.optional(),
};

type GetFinancialSummaryInput = {
  periodStart?: string;
  periodEnd?: string;
};

interface GetFinancialSummaryOutput {
  period: Awaited<ReturnType<typeof getFinancialReportService>>["period"];
  current: {
    revenue: number;
    payrollCost: number | null;
    revenueAfterPayroll: number | null;
    completedAppointments: number;
    dataAvailable: boolean;
  };
  previous: Awaited<ReturnType<typeof getFinancialReportService>>["previous"];
  coverage: Awaited<ReturnType<typeof getFinancialReportService>>["coverage"];
}

const getDefaultPeriod = (currentDate: string) => ({
  periodStart: `${currentDate.slice(0, 7)}-01`,
  periodEnd: currentDate,
});

export const getFinancialSummaryMcpTool: McpToolDefinition<
  GetFinancialSummaryInput,
  GetFinancialSummaryOutput
> = {
  name: "get_financial_summary",
  description:
    "Get the shop's financial summary for a date range. If no dates are provided, use the current month. Includes revenue, payroll cost, revenue after payroll, and completed appointments.",
  access: "FINANCE_READ",
  mode: "read",
  inputSchema,
  execute: async (input, context) => {
    const defaults = getDefaultPeriod(context.currentDate);
    const report = await getFinancialReportService(context.shopSlug, {
      periodStart: input.periodStart ?? defaults.periodStart,
      periodEnd: input.periodEnd ?? defaults.periodEnd,
    });

    return {
      period: report.period,
      current: {
        revenue: report.current.revenue,
        payrollCost: report.current.payroll?.cost ?? null,
        revenueAfterPayroll: report.current.revenueAfterPayroll,
        completedAppointments: report.current.completedAppointments,
        dataAvailable: report.current.dataAvailable,
      },
      previous: report.previous,
      coverage: report.coverage,
    };
  },
};
