import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";

export const requirePayrollAdjustmentPermission = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.user?.role === "SUPER_ADMIN" || req.shopStaff?.role === "OWNER") {
    return next();
  }
  if (
    req.shopStaff?.role === "MANAGER" &&
    req.shopStaff.permissions.includes("PAYROLL_ADJUST")
  ) {
    return next();
  }
  return next(new ApiError(403, "You do not have permission to adjust bonuses or penalties"));
};
