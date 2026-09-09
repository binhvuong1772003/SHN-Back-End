"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffPayrollMcpTool = void 0;
const payroll_service_1 = require("../../../service/payroll/payroll.service");
const common_validate_1 = require("../../../validation/common.validate");
const zod_1 = require("zod");
const inputSchema = {
    staffId: common_validate_1.objectIdSchema.describe("ShopStaff ID of the staff member."),
    periodStart: common_validate_1.dateOnlySchema.optional(),
    periodEnd: common_validate_1.dateOnlySchema.optional(),
    status: zod_1.z.enum(["DRAFT", "CONFIRMED", "PAID"]).optional(),
    page: zod_1.z.coerce.number().int().min(1).max(100).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
};
exports.getStaffPayrollMcpTool = {
    name: "get_staff_payroll",
    description: "Get compact payroll records for a specific staff member in the current shop. Use staffId from get_staff_list or find_staff.",
    access: "PAYROLL_READ_ALL",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const result = await (0, payroll_service_1.getPayrollListService)(context.shopSlug, input);
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
                deductions: payroll.penaltyTotal +
                    payroll.advanceDeduction +
                    payroll.otherDeductions,
            })),
            meta: result.meta,
        };
    },
};
