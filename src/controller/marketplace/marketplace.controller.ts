import type { NextFunction, Request, Response } from "express";
import {
  getPublicMarketplaceShops,
  getPublicShopAvailability,
  getPublicShopBySlug,
  getPublicShopReviews,
} from "@/service/marketplace/marketplace.service";
import { sendSuccess } from "@/utils/apiResponse";

export const getPublicMarketplaceShopsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getPublicMarketplaceShops({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
    });
    sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getPublicShopController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shop = await getPublicShopBySlug(req.params.shopSlug as string);
    sendSuccess(res, shop);
  } catch (error) {
    next(error);
  }
};

export const getPublicShopAvailabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { date, durationMin, staffId } = req.query as unknown as {
      date: string;
      durationMin: number;
      staffId?: string;
    };
    const availability = await getPublicShopAvailability({
      shopSlug: req.params.shopSlug as string,
      date,
      durationMin,
      staffId,
    });
    sendSuccess(res, availability);
  } catch (error) {
    next(error);
  }
};

export const getPublicShopReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviews = await getPublicShopReviews(
      req.params.shopSlug as string,
      req.query as unknown as { page?: number; limit?: number },
    );
    sendSuccess(res, reviews.items, { meta: reviews.meta });
  } catch (error) {
    next(error);
  }
};
