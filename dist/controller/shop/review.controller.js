"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceReviewController = exports.deleteStaffReviewController = exports.deleteShopReviewController = exports.updateServiceReviewController = exports.updateStaffReviewController = exports.updateShopReviewController = exports.getServiceReviewController = exports.getStaffReviewController = exports.getShopReviewController = exports.listServiceReviewsController = exports.listStaffReviewsController = exports.listShopReviewsController = exports.createServiceReviewController = exports.createStaffReviewController = exports.createShopReviewController = void 0;
const review_service_1 = require("../../service/shop/review.service");
const apiResponse_1 = require("../../utils/apiResponse");
const actorId = (req) => req.user?.userId;
const shopSlug = (req) => req.params.shopSlug;
const createShopReviewController = async (req, res, next) => {
    try {
        const review = await (0, review_service_1.createShopReview)(shopSlug(req), actorId(req), req.body);
        (0, apiResponse_1.sendSuccess)(res, review, { statusCode: 201, message: "Shop review created successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.createShopReviewController = createShopReviewController;
const createStaffReviewController = async (req, res, next) => {
    try {
        const review = await (0, review_service_1.createStaffReview)(shopSlug(req), actorId(req), req.body);
        (0, apiResponse_1.sendSuccess)(res, review, { statusCode: 201, message: "Staff review created successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.createStaffReviewController = createStaffReviewController;
const createServiceReviewController = async (req, res, next) => {
    try {
        const review = await (0, review_service_1.createServiceReview)(shopSlug(req), actorId(req), req.body);
        (0, apiResponse_1.sendSuccess)(res, review, { statusCode: 201, message: "Service review created successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.createServiceReviewController = createServiceReviewController;
const listShopReviewsController = async (req, res, next) => {
    try {
        const result = await (0, review_service_1.listShopReviews)(shopSlug(req), req.query);
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.listShopReviewsController = listShopReviewsController;
const listStaffReviewsController = async (req, res, next) => {
    try {
        const result = await (0, review_service_1.listStaffReviews)(shopSlug(req), req.params.staffId, req.query);
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.listStaffReviewsController = listStaffReviewsController;
const listServiceReviewsController = async (req, res, next) => {
    try {
        const result = await (0, review_service_1.listServiceReviews)(shopSlug(req), req.params.serviceId, req.query);
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.listServiceReviewsController = listServiceReviewsController;
const getShopReviewController = async (req, res, next) => {
    try {
        (0, apiResponse_1.sendSuccess)(res, await (0, review_service_1.getShopReview)(shopSlug(req), req.params.reviewId));
    }
    catch (error) {
        next(error);
    }
};
exports.getShopReviewController = getShopReviewController;
const getStaffReviewController = async (req, res, next) => {
    try {
        (0, apiResponse_1.sendSuccess)(res, await (0, review_service_1.getStaffReview)(shopSlug(req), req.params.staffId, req.params.reviewId));
    }
    catch (error) {
        next(error);
    }
};
exports.getStaffReviewController = getStaffReviewController;
const getServiceReviewController = async (req, res, next) => {
    try {
        (0, apiResponse_1.sendSuccess)(res, await (0, review_service_1.getServiceReview)(shopSlug(req), req.params.serviceId, req.params.reviewId));
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceReviewController = getServiceReviewController;
const updateShopReviewController = async (req, res, next) => {
    try {
        const review = await (0, review_service_1.updateShopReview)(shopSlug(req), req.params.reviewId, actorId(req), req.body);
        (0, apiResponse_1.sendSuccess)(res, review, { message: "Shop review updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.updateShopReviewController = updateShopReviewController;
const updateStaffReviewController = async (req, res, next) => {
    try {
        const review = await (0, review_service_1.updateStaffReview)(shopSlug(req), req.params.staffId, req.params.reviewId, actorId(req), req.body);
        (0, apiResponse_1.sendSuccess)(res, review, { message: "Staff review updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.updateStaffReviewController = updateStaffReviewController;
const updateServiceReviewController = async (req, res, next) => {
    try {
        const review = await (0, review_service_1.updateServiceReview)(shopSlug(req), req.params.serviceId, req.params.reviewId, actorId(req), req.body);
        (0, apiResponse_1.sendSuccess)(res, review, { message: "Service review updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.updateServiceReviewController = updateServiceReviewController;
const deleteShopReviewController = async (req, res, next) => {
    try {
        await (0, review_service_1.deleteShopReview)(shopSlug(req), req.params.reviewId, actorId(req));
        (0, apiResponse_1.sendSuccess)(res, null, { message: "Shop review deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteShopReviewController = deleteShopReviewController;
const deleteStaffReviewController = async (req, res, next) => {
    try {
        await (0, review_service_1.deleteStaffReview)(shopSlug(req), req.params.staffId, req.params.reviewId, actorId(req));
        (0, apiResponse_1.sendSuccess)(res, null, { message: "Staff review deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStaffReviewController = deleteStaffReviewController;
const deleteServiceReviewController = async (req, res, next) => {
    try {
        await (0, review_service_1.deleteServiceReview)(shopSlug(req), req.params.serviceId, req.params.reviewId, actorId(req));
        (0, apiResponse_1.sendSuccess)(res, null, { message: "Service review deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteServiceReviewController = deleteServiceReviewController;
