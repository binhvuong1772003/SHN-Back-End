"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPayrollMcpTool = void 0;
const payroll_service_1 = require("../../../service/payroll/payroll.service");
exports.getMyPayrollMcpTool = {
    name: "get_my_payroll",
    description: "Get the authenticated staff member's confirmed or paid payroll records, including gross, net, bonuses, commissions, and deductions.",
    access: "SELF_READ",
    mode: "read",
    inputSchema: {},
    execute: async (_input, context) => {
        const payrolls = await (0, payroll_service_1.getMyPayrollsService)(context.shopSlug, context.userId);
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
                deductions: payroll.penaltyTotal +
                    payroll.advanceDeduction +
                    payroll.otherDeductions,
            })),
        };
    },
};
