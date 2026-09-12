"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const marketplace_controller_1 = require("../controller/marketplace/marketplace.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const common_validate_1 = require("../validation/common.validate");
const marketplace_controller_2 = require("../controller/marketplace/marketplace.controller");
const marketplaceRouter = (0, express_1.Router)();
marketplaceRouter.get("/shops", (0, validation_middleware_1.validate)({ query: common_validate_1.marketplaceShopsQuerySchema }), marketplace_controller_1.getPublicMarketplaceShopsController);
marketplaceRouter.get("/shops/:shopSlug", marketplace_controller_1.getPublicShopController);
marketplaceRouter.get("/shops/:shopSlug/availability", (0, validation_middleware_1.validate)({ query: common_validate_1.calendarSlotsQuerySchema }), marketplace_controller_1.getPublicShopAvailabilityController);
marketplaceRouter.get("/shops/:shopSlug/reviews", (0, validation_middleware_1.validate)({ query: common_validate_1.paginationSchema }), marketplace_controller_1.getPublicShopReviewsController);
marketplaceRouter.get("/shops/:shopSlug/staff/:staffId/reviews", (0, validation_middleware_1.validate)({ params: objectIdSchemaFor("staffId"), query: common_validate_1.paginationSchema }), marketplace_controller_2.getPublicStaffReviewsController);
marketplaceRouter.get("/shops/:shopSlug/services/:serviceId/reviews", (0, validation_middleware_1.validate)({ params: objectIdSchemaFor("serviceId"), query: common_validate_1.paginationSchema }), marketplace_controller_2.getPublicServiceReviewsController);
function objectIdSchemaFor(key) {
    return zod_1.z.object({ [key]: common_validate_1.objectIdSchema });
}
exports.default = marketplaceRouter;
