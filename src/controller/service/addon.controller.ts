// controller/addon/addon.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createAddonService,
  getAddonServices,
  getAddonServiceById,
  updateAddonService,
  deleteAddonService,
} from '@/service/service/addon.service';

export const createAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await createAddonService(shopSlug, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getAddonsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await getAddonServices(shopSlug);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getAddonByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const addonId = req.params.addonId as string;
    const result = await getAddonServiceById(shopSlug, addonId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const addonId = req.params.addonId as string;
    const result = await updateAddonService(shopSlug, addonId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const deleteAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const addonId = req.params.addonId as string;
    await deleteAddonService(shopSlug, addonId);
    res.status(200).json({ success: true, message: 'Xóa addon thành công' });
  } catch (err) {
    next(err);
  }
};
