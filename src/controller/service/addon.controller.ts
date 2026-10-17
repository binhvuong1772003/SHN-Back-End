// controller/addon/addon.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createAddonService,
  getAddonServices,
  getAddonServiceById,
  updateAddonService,
  deleteAddonService,
} from '@/service/service/addon.service';
import { sendSuccess } from '@/utils/apiResponse';

export const createAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await createAddonService(shopSlug, req.body);
    sendSuccess(res, result, { statusCode: 201 });
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
    sendSuccess(res, result);
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
    sendSuccess(res, result);
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
    sendSuccess(res, result);
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
    sendSuccess(res, null, { message: 'Addon deleted successfully' });
  } catch (err) {
    next(err);
  }
};
