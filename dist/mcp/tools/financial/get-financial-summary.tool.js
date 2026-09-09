"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialSummaryMcpTool = void 0;
const financial_report_service_1 = require("../../../service/financial-report/financial-report.service");
const common_validate_1 = require("../../../validation/common.validate");
const inputSchema = {
    periodStart: common_validate_1.dateOnlySchema.optional(),
    periodEnd: common_validate_1.dateOnlySchema.optional(),
};
const getDefaultPeriod = (currentDate) => ({
    periodStart: `${currentDate.slice(0, 7)}-01`,
    periodEnd: currentDate,
});
exports.getFinancialSummaryMcpTool = {
    name: "get_financial_summary",
    description: "Get the shop's financial summary for a date range. If no dates are provided, use the current month. Includes revenue, payroll cost, revenue after payroll, and completed appointments.",
    access: "FINANCE_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const defaults = getDefaultPeriod(context.currentDate);
        const report = await (0, financial_report_service_1.getFinancialReportService)(context.shopSlug, {
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
