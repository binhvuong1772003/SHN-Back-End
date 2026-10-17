import type { NextFunction, Request, Response } from "express";
import { getFinancialReportService } from "@/service/financial-report/financial-report.service";
import type { FinancialReportQuery } from "@/validation/financial-report.validate";
import { sendSuccess } from "@/utils/apiResponse";

export const getFinancialReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await getFinancialReportService(
      req.params.shopSlug as string,
      req.query as unknown as FinancialReportQuery,
    );
    return sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
};
