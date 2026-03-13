import { Request, Response, NextFunction } from 'express';
import {
  checkInService,
  qrCheckInService,
  generateCheckInQRService,
  generateCheckOutQRService,
  qrCheckOutService,
} from '@/service/staff/attendance.service';
export const checkInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId as string;
    const shopSlug = req.params.shopSlug as string;
    const attendance = await checkInService(userId, shopSlug);
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};
export const qrCheckInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.query.token as string;
    const shopSlug = req.params.shopSlug as string;
    const userId = req.user?.userId as string;
    const attendance = await qrCheckInService(token, shopSlug, userId);
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};
export const qrCheckOutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.query.token as string;
    const shopSlug = req.params.shopSlug as string;
    const userId = req.user?.userId as string;
    const attendance = await qrCheckOutService(token, shopSlug, userId);
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};
export const getCheckInQRController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const qr = await generateCheckInQRService(shopSlug);
    res.status(200).json({ success: true, data: qr });
  } catch (error) {
    next(error);
  }
};
export const getCheckOutQRController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const qr = await generateCheckOutQRService(shopSlug);
    res.status(200).json({ success: true, data: qr });
  } catch (error) {
    next(error);
  }
};
