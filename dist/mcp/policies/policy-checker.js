"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUseMcpTool = void 0;
const canUseMcpTool = (context, access) => {
    if (access === "SELF_READ")
        return true;
    if (access === "SHOP_READ" || access === "FINANCE_READ") {
        return context.role === "MANAGER" || context.role === "OWNER";
    }
    if (access === "PAYROLL_READ_ALL")
        return context.role === "MANAGER" || context.role === "OWNER";
    return context.role === "OWNER";
};
exports.canUseMcpTool = canUseMcpTool;
