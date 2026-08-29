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
    const result = await getService(shopSlug, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 5,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: req.query.status === "ACTIVE" || req.query.status === "INACTIVE" ? req.query.status : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      sort: typeof req.query.sort === "string" ? req.query.sort as any : undefined,
    });
    res.status(200).json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages, counts: result.counts } });
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
