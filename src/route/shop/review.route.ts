import { Router } from "express";
import { z } from "zod";
import { validate } from "@/middleware/validation.middleware";
import { objectIdSchema, paginationSchema } from "@/validation/common.validate";
import {
  createServiceReviewSchema,
  createShopReviewSchema,
  createStaffReviewSchema,
  reviewIdParamsSchema,
  updateReviewSchema,
} from "@/validation/review.validate";
import {
  createServiceReviewController,
  createShopReviewController,
  createStaffReviewController,
  deleteServiceReviewController,
  deleteShopReviewController,
  deleteStaffReviewController,
  getServiceReviewController,
  getShopReviewController,
  getStaffReviewController,
  listServiceReviewsController,
  listShopReviewsController,
  listStaffReviewsController,
  updateServiceReviewController,
  updateShopReviewController,
  updateStaffReviewController,
} from "@/controller/shop/review.controller";

const reviewRouter = Router({ mergeParams: true });

reviewRouter.get("/shop", validate({ query: paginationSchema }), listShopReviewsController);
reviewRouter.post("/shop", validate(createShopReviewSchema), createShopReviewController);
reviewRouter.get("/shop/:reviewId", validate(reviewIdParamsSchema), getShopReviewController);
reviewRouter.patch("/shop/:reviewId", validate({ ...reviewIdParamsSchema, body: updateReviewSchema.body }), updateShopReviewController);
reviewRouter.delete("/shop/:reviewId", validate(reviewIdParamsSchema), deleteShopReviewController);

const staffTargetParams = z.object({ staffId: objectIdSchema });
reviewRouter.get(
  "/staff/:staffId",
  validate({ params: staffTargetParams, query: paginationSchema }),
  listStaffReviewsController,
);
reviewRouter.post("/staff", validate(createStaffReviewSchema), createStaffReviewController);
reviewRouter.get(
  "/staff/:staffId/:reviewId",
  validate({ params: reviewIdParamsSchema.params.extend({ staffId: objectIdSchema }) }),
  getStaffReviewController,
);
reviewRouter.patch(
  "/staff/:staffId/:reviewId",
  validate({ params: reviewIdParamsSchema.params.extend({ staffId: objectIdSchema }), body: updateReviewSchema.body }),
  updateStaffReviewController,
);
reviewRouter.delete(
  "/staff/:staffId/:reviewId",
  validate({ params: reviewIdParamsSchema.params.extend({ staffId: objectIdSchema }) }),
  deleteStaffReviewController,
);

reviewRouter.get(
  "/service/:serviceId",
  validate({ params: z.object({ serviceId: objectIdSchema }), query: paginationSchema }),
  listServiceReviewsController,
);
reviewRouter.post("/service", validate(createServiceReviewSchema), createServiceReviewController);
reviewRouter.get(
  "/service/:serviceId/:reviewId",
  validate({ params: reviewIdParamsSchema.params.extend({ serviceId: objectIdSchema }) }),
  getServiceReviewController,
);
reviewRouter.patch(
  "/service/:serviceId/:reviewId",
  validate({ params: reviewIdParamsSchema.params.extend({ serviceId: objectIdSchema }), body: updateReviewSchema.body }),
  updateServiceReviewController,
);
reviewRouter.delete(
  "/service/:serviceId/:reviewId",
  validate({ params: reviewIdParamsSchema.params.extend({ serviceId: objectIdSchema }) }),
  deleteServiceReviewController,
);

export default reviewRouter;
