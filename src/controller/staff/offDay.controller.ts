import { Request, Response, NextFunction } from 'express';
import {
  requestOffDayService,
  responseOffDayService,
  getListOffDayService,
  getDetailOffDayService,
} from '@/service/staff/offDay.service';
export const requestOffDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const data = req.body;
    const result = await requestOffDayService(shopSlug, staffId, data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const responseOffDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offDayId } = req.params;
    const data = req.body;
    const result = await responseOffDayService(offDayId as string, data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const getListOffDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug } = req.params;
    const result = await getListOffDayService(shopSlug as string);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const getDetailDayOffController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offDayId } = req.params;
    const result = await getDetailOffDayService(offDayId as string);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
