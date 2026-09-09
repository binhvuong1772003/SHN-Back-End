"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicShopReviewsController = exports.getPublicShopAvailabilityController = exports.getPublicShopController = exports.getPublicMarketplaceShopsController = void 0;
const marketplace_service_1 = require("../../service/marketplace/marketplace.service");
const apiResponse_1 = require("../../utils/apiResponse");
const getPublicMarketplaceShopsController = async (req, res, next) => {
    try {
        const result = await (0, marketplace_service_1.getPublicMarketplaceShops)({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 12,
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            city: typeof req.query.city === "string" ? req.query.city : undefined,
        });
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicMarketplaceShopsController = getPublicMarketplaceShopsController;
const getPublicShopController = async (req, res, next) => {
    try {
        const shop = await (0, marketplace_service_1.getPublicShopBySlug)(req.params.shopSlug);
        (0, apiResponse_1.sendSuccess)(res, shop);
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicShopController = getPublicShopController;
const getPublicShopAvailabilityController = async (req, res, next) => {
    try {
        const { date, durationMin, staffId } = req.query;
        const availability = await (0, marketplace_service_1.getPublicShopAvailability)({
            shopSlug: req.params.shopSlug,
            date,
            durationMin,
            staffId,
        });
        (0, apiResponse_1.sendSuccess)(res, availability);
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicShopAvailabilityController = getPublicShopAvailabilityController;
const getPublicShopReviewsController = async (req, res, next) => {
    try {
        const reviews = await (0, marketplace_service_1.getPublicShopReviews)(req.params.shopSlug, req.query);
        (0, apiResponse_1.sendSuccess)(res, reviews.items, { meta: reviews.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicShopReviewsController = getPublicShopReviewsController;
