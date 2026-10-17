import { z } from "zod";
import { objectIdSchema, paginationSchema } from "@/validation/common.validate";

const reviewFieldsSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
});

export const createShopReviewSchema = {
  body: reviewFieldsSchema.extend({ appointmentId: objectIdSchema }),
};

export const createStaffReviewSchema = {
  body: reviewFieldsSchema.extend({ appointmentId: objectIdSchema }),
};

export const createServiceReviewSchema = {
  body: reviewFieldsSchema.extend({ appointmentServiceId: objectIdSchema }),
};

export const reviewIdParamsSchema = {
  params: z.object({ reviewId: objectIdSchema }),
};

export const staffReviewParamsSchema = {
  params: z.object({ staffId: objectIdSchema, reviewId: objectIdSchema.optional() }),
};

export const serviceReviewParamsSchema = {
  params: z.object({ serviceId: objectIdSchema, reviewId: objectIdSchema.optional() }),
};

export const reviewListQuerySchema = paginationSchema;

export const updateReviewSchema = {
  body: reviewFieldsSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    "At least one review field is required",
  ),
};

export type CreateShopReviewInput = z.infer<typeof createShopReviewSchema.body>;
export type CreateStaffReviewInput = z.infer<typeof createStaffReviewSchema.body>;
export type CreateServiceReviewInput = z.infer<typeof createServiceReviewSchema.body>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema.body>;
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
