import { Request, Response, NextFunction } from "express";
import {
  adjustDraftPayrollService,
  confirmPayrollService,
  generateDraftPayrollsService,
  getMyPayrollDetailService,
  getMyPayrollsService,
  getPayrollDetailService,
  getPayrollListService,
  getSalaryConfigService,
  getServiceCommissionsService,
  payPayrollService,
  upsertSalaryConfigService,
  upsertServiceCommissionService,
} from "@/service/payroll/payroll.service";
import { sendSuccess } from "@/utils/apiResponse";

export const getSalaryConfigController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getSalaryConfigService(
      req.params.shopSlug as string,
      req.params.staffId as string,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const upsertSalaryConfigController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await upsertSalaryConfigService(
      req.params.shopSlug as string,
      req.params.staffId as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getServiceCommissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getServiceCommissionsService(
      req.params.shopSlug as string,
      req.params.staffId as string,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const upsertServiceCommissionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await upsertServiceCommissionService(
      req.params.shopSlug as string,
      req.params.staffId as string,
      req.params.serviceId as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const generateDraftPayrollsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await generateDraftPayrollsService(
      req.params.shopSlug as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, result, { statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

export const getPayrollListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getPayrollListService(
      req.params.shopSlug as string,
      req.query as {
        periodStart?: string;
        periodEnd?: string;
        status?: "DRAFT" | "CONFIRMED" | "PAID";
        staffId?: string;
        page?: number;
        limit?: number;
      },
    );
    return sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getPayrollDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getPayrollDetailService(
      req.params.shopSlug as string,
      req.params.payrollId as string,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const adjustDraftPayrollController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await adjustDraftPayrollService(
      req.params.shopSlug as string,
      req.params.payrollId as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const confirmPayrollController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await confirmPayrollService(
      req.params.shopSlug as string,
      req.params.payrollId as string,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const payPayrollController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await payPayrollService(
      req.params.shopSlug as string,
      req.params.payrollId as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMyPayrollsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getMyPayrollsService(
      req.params.shopSlug as string,
      req.user!.userId,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMyPayrollDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getMyPayrollDetailService(
      req.params.shopSlug as string,
      req.user!.userId,
      req.params.payrollId as string,
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
