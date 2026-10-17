// controller/service/servicePackage.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createServicePackage,
  getServicePackages,
  getServicePackageById,
  updateServicePackage,
  deleteServicePackage,
} from '@/service/service/servicePackage.service';
import { sendSuccess } from '@/utils/apiResponse';

export const createServicePackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await createServicePackage(req.body, shopSlug);
    sendSuccess(res, result, { statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

export const getServicePackagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await getServicePackages(shopSlug);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getServicePackageByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const packageId = req.params.packageId as string;
    const result = await getServicePackageById(shopSlug, packageId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateServicePackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const packageId = req.params.packageId as string;
    const result = await updateServicePackage(shopSlug, packageId, req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const deleteServicePackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const packageId = req.params.packageId as string;
    await deleteServicePackage(shopSlug, packageId);
    sendSuccess(res, null, { message: 'Package deleted successfully' });
  } catch (err) {
    next(err);
  }
};
