// controller/service/serviceOption.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createServiceOption,
  getServiceOptions,
  getServiceOptionById,
  updateServiceOptionController,
  deleteServiceOption,
} from '@/service/service/option.service';

export const createServiceOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const result = await createServiceOption(req.body, shopSlug, serviceId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getServiceOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    console.log(shopSlug);
    const serviceId = req.params.serviceId as string;
    const result = await getServiceOptions(serviceId, shopSlug);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getServiceOptionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const optionId = req.params.optionId as string;
    const result = await getServiceOptionById(optionId, shopSlug, serviceId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateServiceOptionCtrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const optionId = req.params.optionId as string;
    const result = await updateServiceOptionController(
      req.body,
      shopSlug,
      serviceId,
      optionId
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const deleteServiceOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const optionId = req.params.optionId as string;
    await deleteServiceOption(shopSlug, serviceId, optionId);
    res.status(200).json({ success: true, message: 'Xóa option thành công' });
  } catch (err) {
    next(err);
  }
};
