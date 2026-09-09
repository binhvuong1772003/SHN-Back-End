"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueSummaryMcpTool = void 0;
const financial_report_service_1 = require("../../../service/financial-report/financial-report.service");
const common_validate_1 = require("../../../validation/common.validate");
const zod_1 = require("zod");
const inputSchema = {
    periodStart: common_validate_1.dateOnlySchema.optional(),
    periodEnd: common_validate_1.dateOnlySchema.optional(),
    groupBy: zod_1.z.enum(["day", "service", "staff"]).default("service"),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(8),
};
const getDefaultPeriod = (currentDate) => ({
    periodStart: `${currentDate.slice(0, 7)}-01`,
    periodEnd: currentDate,
});
exports.getRevenueSummaryMcpTool = {
    name: "get_revenue_summary",
    description: "Get revenue breakdown for the current shop by day, service, or staff. If no dates are provided, use the current month.",
    access: "FINANCE_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const defaults = getDefaultPeriod(context.currentDate);
        const report = await (0, financial_report_service_1.getFinancialReportService)(context.shopSlug, {
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
