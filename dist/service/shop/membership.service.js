"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentShopMembershipService = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const getCurrentShopMembershipService = async (shopSlug, userId) => {
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const membership = await prisma_1.db.shopStaff.findFirst({
        where: {
            userId,
            shop: { slug: shopSlug },
        },
        select: {
            id: true,
            shopId: true,
            userId: true,
            role: true,
            isActive: true,
        },
    });
    if (!membership) {
        throw new ApiError_1.ApiError(404, "Membership not found in this shop");
    }
    return {
        id: membership.id,
        shopId: membership.shopId,
        userId: membership.userId,
        // ShopStaff is both the membership and staff profile in the current schema.
        staffId: membership.id,
        role: membership.role === "MANAGER" ? "ADMIN" : membership.role,
        status: membership.isActive ? "ACTIVE" : "INACTIVE",
    };
};
exports.getCurrentShopMembershipService = getCurrentShopMembershipService;
