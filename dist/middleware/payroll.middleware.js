"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePayrollAdjustmentPermission = void 0;
const ApiError_1 = require("@/utils/ApiError");
const requirePayrollAdjustmentPermission = (req, _res, next) => {
    if (req.user?.role === "SUPER_ADMIN" || req.shopStaff?.role === "OWNER") {
        return next();
    }
    if (req.shopStaff?.role === "MANAGER" &&
        req.shopStaff.permissions.includes("PAYROLL_ADJUST")) {
        return next();
    }
    return next(new ApiError_1.ApiError(403, "You do not have permission to adjust bonuses or penalties"));
};
exports.requirePayrollAdjustmentPermission = requirePayrollAdjustmentPermission;
