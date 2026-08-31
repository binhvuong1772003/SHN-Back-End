import { Request, Response, NextFunction } from 'express';
import {
  getListNotification,
  markRead,
  deleteNotification,
} from '@/service/notification/notification.service';
import { sendSuccess } from '@/utils/apiResponse';
export const getListNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    console.log('shopSlug:', shopSlug);
    const result = await getListNotification(shopSlug, req.query as unknown as { page?: number; limit?: number });
    sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) {
    next(error);
  }
};
export const markReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await markRead(id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
export const deleteNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await deleteNotification(id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
