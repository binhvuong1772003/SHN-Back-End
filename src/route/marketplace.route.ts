import { Router } from "express";
import { z } from "zod";
import {
  getPublicMarketplaceShopsController,
  getPublicShopAvailabilityController,
  getPublicShopController,
  getPublicShopReviewsController,
} from "@/controller/marketplace/marketplace.controller";
import { validate } from "@/middleware/validation.middleware";
import {
  calendarSlotsQuerySchema,
  marketplaceShopsQuerySchema,
  paginationSchema,
  objectIdSchema,
} from "@/validation/common.validate";
import {
  getPublicServiceReviewsController,
  getPublicStaffReviewsController,
} from "@/controller/marketplace/marketplace.controller";

const marketplaceRouter = Router();

marketplaceRouter.get(
  "/shops",
  validate({ query: marketplaceShopsQuerySchema }),
  getPublicMarketplaceShopsController,
);
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
marketplaceRouter.get(
  "/shops/:shopSlug/staff/:staffId/reviews",
  validate({ params: objectIdSchemaFor("staffId"), query: paginationSchema }),
  getPublicStaffReviewsController,
);
marketplaceRouter.get(
  "/shops/:shopSlug/services/:serviceId/reviews",
  validate({ params: objectIdSchemaFor("serviceId"), query: paginationSchema }),
  getPublicServiceReviewsController,
);

function objectIdSchemaFor(key: string) {
  return z.object({ [key]: objectIdSchema });
}

export default marketplaceRouter;
