import type { NextFunction, Request, Response } from "express";
import {
  createServiceReview,
  createShopReview,
  createStaffReview,
  deleteServiceReview,
  deleteShopReview,
  deleteStaffReview,
  getServiceReview,
  getShopReview,
  getStaffReview,
  listServiceReviews,
  listShopReviews,
  listStaffReviews,
  updateServiceReview,
  updateShopReview,
  updateStaffReview,
} from "@/service/shop/review.service";
import type {
  CreateServiceReviewInput,
  CreateShopReviewInput,
  CreateStaffReviewInput,
  ReviewListQuery,
  UpdateReviewInput,
} from "@/validation/review.validate";
import { sendSuccess } from "@/utils/apiResponse";

const actorId = (req: Request) => req.user?.userId as string;
const shopSlug = (req: Request) => req.params.shopSlug as string;

export const createShopReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await createShopReview(shopSlug(req), actorId(req), req.body as CreateShopReviewInput);
    sendSuccess(res, review, { statusCode: 201, message: "Shop review created successfully" });
  } catch (error) { next(error); }
};

export const createStaffReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await createStaffReview(shopSlug(req), actorId(req), req.body as CreateStaffReviewInput);
    sendSuccess(res, review, { statusCode: 201, message: "Staff review created successfully" });
  } catch (error) { next(error); }
};

export const createServiceReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await createServiceReview(shopSlug(req), actorId(req), req.body as CreateServiceReviewInput);
    sendSuccess(res, review, { statusCode: 201, message: "Service review created successfully" });
  } catch (error) { next(error); }
};

export const listShopReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listShopReviews(shopSlug(req), req.query as unknown as ReviewListQuery);
    sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) { next(error); }
};

export const listStaffReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listStaffReviews(shopSlug(req), req.params.staffId as string, req.query as unknown as ReviewListQuery);
    sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) { next(error); }
};

export const listServiceReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listServiceReviews(shopSlug(req), req.params.serviceId as string, req.query as unknown as ReviewListQuery);
    sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) { next(error); }
};

export const getShopReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await getShopReview(shopSlug(req), req.params.reviewId as string)); }
  catch (error) { next(error); }
};

export const getStaffReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await getStaffReview(shopSlug(req), req.params.staffId as string, req.params.reviewId as string)); }
  catch (error) { next(error); }
};

export const getServiceReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await getServiceReview(shopSlug(req), req.params.serviceId as string, req.params.reviewId as string)); }
  catch (error) { next(error); }
};

export const updateShopReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await updateShopReview(shopSlug(req), req.params.reviewId as string, actorId(req), req.body as UpdateReviewInput);
    sendSuccess(res, review, { message: "Shop review updated successfully" });
  } catch (error) { next(error); }
};

export const updateStaffReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await updateStaffReview(shopSlug(req), req.params.staffId as string, req.params.reviewId as string, actorId(req), req.body as UpdateReviewInput);
    sendSuccess(res, review, { message: "Staff review updated successfully" });
  } catch (error) { next(error); }
};

export const updateServiceReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await updateServiceReview(shopSlug(req), req.params.serviceId as string, req.params.reviewId as string, actorId(req), req.body as UpdateReviewInput);
    sendSuccess(res, review, { message: "Service review updated successfully" });
  } catch (error) { next(error); }
};

export const deleteShopReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { await deleteShopReview(shopSlug(req), req.params.reviewId as string, actorId(req)); sendSuccess(res, null, { message: "Shop review deleted successfully" }); }
  catch (error) { next(error); }
};

export const deleteStaffReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { await deleteStaffReview(shopSlug(req), req.params.staffId as string, req.params.reviewId as string, actorId(req)); sendSuccess(res, null, { message: "Staff review deleted successfully" }); }
  catch (error) { next(error); }
};

export const deleteServiceReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { await deleteServiceReview(shopSlug(req), req.params.serviceId as string, req.params.reviewId as string, actorId(req)); sendSuccess(res, null, { message: "Service review deleted successfully" }); }
  catch (error) { next(error); }
};
