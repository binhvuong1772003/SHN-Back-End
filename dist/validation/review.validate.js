"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewSchema = exports.reviewListQuerySchema = exports.serviceReviewParamsSchema = exports.staffReviewParamsSchema = exports.reviewIdParamsSchema = exports.createServiceReviewSchema = exports.createStaffReviewSchema = exports.createShopReviewSchema = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../validation/common.validate");
const reviewFieldsSchema = zod_1.z.object({
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().max(2000).optional(),
    imageUrls: zod_1.z.array(zod_1.z.string().url()).max(10).optional(),
});
exports.createShopReviewSchema = {
    body: reviewFieldsSchema.extend({ appointmentId: common_validate_1.objectIdSchema }),
};
exports.createStaffReviewSchema = {
    body: reviewFieldsSchema.extend({ appointmentId: common_validate_1.objectIdSchema }),
};
exports.createServiceReviewSchema = {
    body: reviewFieldsSchema.extend({ appointmentServiceId: common_validate_1.objectIdSchema }),
};
exports.reviewIdParamsSchema = {
    params: zod_1.z.object({ reviewId: common_validate_1.objectIdSchema }),
};
exports.staffReviewParamsSchema = {
    params: zod_1.z.object({ staffId: common_validate_1.objectIdSchema, reviewId: common_validate_1.objectIdSchema.optional() }),
};
exports.serviceReviewParamsSchema = {
    params: zod_1.z.object({ serviceId: common_validate_1.objectIdSchema, reviewId: common_validate_1.objectIdSchema.optional() }),
};
exports.reviewListQuerySchema = common_validate_1.paginationSchema;
exports.updateReviewSchema = {
    body: reviewFieldsSchema.partial().refine((value) => Object.keys(value).length > 0, "At least one review field is required"),
};
