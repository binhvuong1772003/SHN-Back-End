// controller/service/serviceOption.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createServiceOption,
  getServiceOptions,
  getServiceOptionById,
  updateServiceOptionController,
  deleteServiceOption,
} from '@/service/service/option.service';
import { sendSuccess } from '@/utils/apiResponse';

export const createServiceOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const result = await createServiceOption(req.body, shopSlug, serviceId);
    sendSuccess(res, result, { statusCode: 201 });
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
    sendSuccess(res, result);
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
    sendSuccess(res, result);
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
    sendSuccess(res, result);
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
    sendSuccess(res, null, { message: 'Option deleted successfully' });
  } catch (err) {
    next(err);
  }
};
