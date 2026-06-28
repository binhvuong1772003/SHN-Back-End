import { Request, Response, NextFunction } from 'express';
import {
  getListNotification,
  markRead,
  deleteNotification,
} from '@/service/notification/notification.service';
export const getListNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    console.log('shopSlug:', shopSlug); // ← log xem có giá trị không
    const result = await getListNotification(shopSlug);
    res.status(200).json({ success: true, data: result });
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
    res.status(200).json({ success: true, data: result });
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
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
