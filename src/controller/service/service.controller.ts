import {
  createService,
  getService,
  getServiceById,
  deleteService,
  updateService,
  countService,
} from "@/service/service/service.service";
import { Request, Response, NextFunction } from "express";
export const createServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const shopSlug = req.params.shopSlug as string;
    const result = await createService(data, shopSlug);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const getSerivceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await getService(shopSlug);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const getServiceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const result = await getServiceById(shopSlug, serviceId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const deleteServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const result = await deleteService(shopSlug, serviceId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const updateServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("🔄 Update service request:", {
      shopSlug: req.params.shopSlug,
      serviceId: req.params.serviceId,
      body: req.body,
    });
    const shopSlug = req.params.shopSlug as string;
    const serviceId = req.params.serviceId as string;
    const data = req.body;
    const result = await updateService(shopSlug, serviceId, data);
    console.log("✅ Update service success");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Update service error:", error);
    next(error);
  }
};
export const countServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await countService(shopSlug);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
