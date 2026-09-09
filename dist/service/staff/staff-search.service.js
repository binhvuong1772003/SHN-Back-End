"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findStaffByNameService = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const findStaffByNameService = async (shopSlug, staffName, limit = 5) => {
    const search = staffName.trim();
    if (!search) {
        throw new ApiError_1.ApiError(400, "Staff name is required");
    }
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
        select: { id: true },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const safeLimit = Math.min(Math.max(limit, 1), 5);
    const staffMembers = await prisma_1.db.shopStaff.findMany({
        where: {
            shopId: shop.id,
            isActive: true,
            OR: [
                { nickname: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
            ],
        },
        orderBy: { joinedAt: "asc" },
        take: safeLimit,
        select: {
            id: true,
            nickname: true,
            role: true,
            user: {
                select: {
                    name: true,
                },
            },
        },
    });
    return staffMembers.map((staff) => ({
        staffId: staff.id,
        name: staff.user.name,
        nickname: staff.nickname,
        role: staff.role,
    }));
};
exports.findStaffByNameService = findStaffByNameService;
