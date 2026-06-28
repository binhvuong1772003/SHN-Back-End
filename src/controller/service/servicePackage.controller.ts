// controller/service/servicePackage.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createServicePackage,
  getServicePackages,
  getServicePackageById,
  updateServicePackage,
  deleteServicePackage,
} from '@/service/service/servicePackage.service';

export const createServicePackageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await createServicePackage(req.body, shopSlug);
    res.status(201).json({ success: true, data: result });
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
    res.status(200).json({ success: true, data: result });
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
    res.status(200).json({ success: true, data: result });
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
    res.status(200).json({ success: true, data: result });
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
    res.status(200).json({ success: true, message: 'Xóa package thành công' });
  } catch (err) {
    next(err);
  }
};
