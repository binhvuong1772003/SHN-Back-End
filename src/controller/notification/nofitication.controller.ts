import { Request, Response, NextFunction } from 'express';
import {
  getListNotification,
  markRead,
  deleteNotification,
  markAllRead,
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
    const result = await getListNotification(shopSlug, req.user?.userId!, req.query as unknown as { page?: number; limit?: number });
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
    const shopSlug = req.params.shopSlug as string;
    const result = await markRead(shopSlug, req.user?.userId!, id);
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
    const shopSlug = req.params.shopSlug as string;
    const result = await deleteNotification(shopSlug, req.user?.userId!, id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const markAllReadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await markAllRead(shopSlug, req.user?.userId!);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
