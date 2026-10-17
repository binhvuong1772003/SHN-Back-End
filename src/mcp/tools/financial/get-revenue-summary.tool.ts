import { getFinancialReportService } from "@/service/financial-report/financial-report.service";
import { dateOnlySchema } from "@/validation/common.validate";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";
import { z } from "zod";

const inputSchema = {
  periodStart: dateOnlySchema.optional(),
  periodEnd: dateOnlySchema.optional(),
  groupBy: z.enum(["day", "service", "staff"]).default("service"),
  limit: z.coerce.number().int().min(1).max(50).default(8),
};

type GetRevenueSummaryInput = {
  periodStart?: string;
  periodEnd?: string;
  groupBy?: "day" | "service" | "staff";
  limit?: number;
};

const getDefaultPeriod = (currentDate: string) => ({
  periodStart: `${currentDate.slice(0, 7)}-01`,
  periodEnd: currentDate,
});

export const getRevenueSummaryMcpTool: McpToolDefinition<
  GetRevenueSummaryInput,
  Record<string, unknown>
> = {
  name: "get_revenue_summary",
  description:
    "Get revenue breakdown for the current shop by day, service, or staff. If no dates are provided, use the current month.",
  access: "FINANCE_READ",
  mode: "read",
  inputSchema,
  execute: async (input, context) => {
    const defaults = getDefaultPeriod(context.currentDate);
    const report = await getFinancialReportService(context.shopSlug, {
      periodStart: input.periodStart ?? defaults.periodStart,
      periodEnd: input.periodEnd ?? defaults.periodEnd,
    });
    const limit = input.limit ?? 8;

    if (input.groupBy === "day") {
      return {
        period: report.period,
        revenue: report.current.revenue,
        items: report.current.trend.slice(-limit),
      };
    }

    if (input.groupBy === "staff") {
      return {
        period: report.period,
        revenue: report.current.revenue,
        items: report.current.staffPerformance.slice(0, limit).map((staff) => ({
          staffId: staff.staffId,
          name: staff.name,
          appointments: staff.appointments,
          revenue: staff.revenue,
          commission: staff.commission,
        })),
      };
    }

    return {
      period: report.period,
      revenue: report.current.revenue,
      items: report.current.topServices.slice(0, limit),
    };
  },
};
