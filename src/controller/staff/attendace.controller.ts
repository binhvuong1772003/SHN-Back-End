import { Request, Response, NextFunction } from "express";
import {
  adjustAttendanceService,
  generateCheckInQRService,
  generateCheckOutQRService,
  getMyAttendanceHistoryService,
  getMyTodayAttendanceService,
  getShopAttendanceService,
  manualAttendanceService,
  qrCheckInService,
  qrCheckOutService,
} from "@/service/staff/attendance.service";
import { sendSuccess } from "@/utils/apiResponse";

export const qrCheckInController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await qrCheckInService(
      req.body.qrToken,
      req.params.shopSlug as string,
      req.user!.userId,
    );
    return sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
};

export const qrCheckOutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await qrCheckOutService(
      req.body.qrToken,
      req.params.shopSlug as string,
      req.user!.userId,
    );
    return sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
};

export const getCheckInQRController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const qr = await generateCheckInQRService(req.params.shopSlug as string);
    return sendSuccess(res, qr);
  } catch (error) {
    next(error);
  }
};

export const getCheckOutQRController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const qr = await generateCheckOutQRService(req.params.shopSlug as string);
    return sendSuccess(res, qr);
  } catch (error) {
    next(error);
  }
};

export const manualAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await manualAttendanceService(
      req.params.shopSlug as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
};

export const getMyTodayAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await getMyTodayAttendanceService(
      req.params.shopSlug as string,
      req.user!.userId,
    );
    return sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
};

export const getMyAttendanceHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await getMyAttendanceHistoryService(
      req.params.shopSlug as string,
      req.user!.userId,
      req.query as { from?: string; to?: string; page?: number; limit?: number },
    );
    return sendSuccess(res, attendance.items, { meta: attendance.meta });
  } catch (error) {
    next(error);
  }
};

export const getShopAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await getShopAttendanceService(
      req.params.shopSlug as string,
      req.query as {
        date?: string;
        from?: string;
        to?: string;
        staffId?: string;
        page?: number;
        limit?: number;
      },
    );
    return sendSuccess(res, attendance.items, { meta: attendance.meta });
  } catch (error) {
    next(error);
  }
};

export const adjustAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attendance = await adjustAttendanceService(
      req.params.shopSlug as string,
      req.params.attendanceId as string,
      req.body,
      req.user!.userId,
      req.ip,
    );
    return sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
};
