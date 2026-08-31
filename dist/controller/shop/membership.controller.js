"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentShopMembershipController = void 0;
const membership_service_1 = require("../../service/shop/membership.service");
const apiResponse_1 = require("../../utils/apiResponse");
const getCurrentShopMembershipController = async (req, res, next) => {
    try {
        const membership = await (0, membership_service_1.getCurrentShopMembershipService)(req.params.shopSlug, req.user.userId);
        return (0, apiResponse_1.sendSuccess)(res, membership);
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentShopMembershipController = getCurrentShopMembershipController;
