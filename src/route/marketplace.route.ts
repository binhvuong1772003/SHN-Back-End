import { Router } from "express";
import {
  getPublicMarketplaceShopsController,
  getPublicShopAvailabilityController,
  getPublicShopController,
  getPublicShopReviewsController,
} from "@/controller/marketplace/marketplace.controller";
import { validate } from "@/middleware/validation.middleware";
import { calendarSlotsQuerySchema, paginationSchema } from "@/validation/common.validate";

const marketplaceRouter = Router();

marketplaceRouter.get("/shops", getPublicMarketplaceShopsController);
marketplaceRouter.get("/shops/:shopSlug", getPublicShopController);
marketplaceRouter.get(
  "/shops/:shopSlug/availability",
  validate({ query: calendarSlotsQuerySchema }),
  getPublicShopAvailabilityController,
);
marketplaceRouter.get(
  "/shops/:shopSlug/reviews",
  validate({ query: paginationSchema }),
  getPublicShopReviewsController,
);

export default marketplaceRouter;
