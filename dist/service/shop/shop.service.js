"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessHoursService = exports.getBusinessHoursService = exports.uploadShopBannerService = exports.uploadShopLogoService = exports.updateShopService = exports.getListShopService = exports.createShopService = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const cloudinary_1 = require("@/utils/cloudinary");
const createShopService = async (data, ownerId) => {
    if (!ownerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const existing = await prisma_1.db.shop.findUnique({
        where: { slug: data.slug },
    });
    if (existing)
        throw new ApiError_1.ApiError(400, "Shop already exists");
    const shop = await prisma_1.db.shop.create({
        data: {
            ...data,
            ownerId,
            staffMembers: {
                create: {
                    userId: ownerId,
                    role: "OWNER",
                },
            },
        },
    });
    await prisma_1.db.user.update({
        where: { id: ownerId },
        data: { role: "SHOP_MEMBER" },
    });
    return shop;
};
exports.createShopService = createShopService;
const getListShopService = async (ownerId) => {
    if (!ownerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    return prisma_1.db.shop.findMany({
        where: {
            OR: [
                { ownerId },
                { staffMembers: { some: { userId: ownerId, isActive: true } } },
            ],
        },
    });
};
exports.getListShopService = getListShopService;
const updateShopService = async (shopSlug, data) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return prisma_1.db.shop.update({
        where: { slug: shopSlug },
        data,
    });
};
exports.updateShopService = updateShopService;
const uploadShopLogoService = async (file, folder, shopSlug) => {
    if (!file)
        throw new ApiError_1.ApiError(400, "File not found");
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (shop.logoPublicId)
        await (0, cloudinary_1.deleteFromCloudinary)(shop.logoPublicId);
    const result = await (0, cloudinary_1.uploadToCloudinary)(file, folder, `${shopSlug}_logo`);
    return await prisma_1.db.shop.update({
        where: { slug: shopSlug },
        data: {
            logoUrl: result.secure_url,
            logoPublicId: result.public_id,
        },
    });
};
exports.uploadShopLogoService = uploadShopLogoService;
const uploadShopBannerService = async (file, folder, shopSlug) => {
    if (!file)
        throw new ApiError_1.ApiError(400, "File not found");
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (shop.coverPublicId)
        await (0, cloudinary_1.deleteFromCloudinary)(shop.coverPublicId);
    const result = await (0, cloudinary_1.uploadToCloudinary)(file, folder, `${shopSlug}_logo`);
    return await prisma_1.db.shop.update({
        where: { slug: shopSlug },
        data: {
            coverUrl: result.secure_url,
            coverPublicId: result.public_id,
        },
    });
};
exports.uploadShopBannerService = uploadShopBannerService;
const getBusinessHoursService = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return prisma_1.db.shopBusinessHour.findMany({
        where: { shopId: shop.id },
        orderBy: { dayOfWeek: "asc" },
    });
};
exports.getBusinessHoursService = getBusinessHoursService;
const updateBusinessHoursService = async (shopSlug, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    await prisma_1.db.$transaction(data.map((day) => prisma_1.db.shopBusinessHour.upsert({
        where: {
            shopId_dayOfWeek: { shopId: shop.id, dayOfWeek: day.dayOfWeek },
        },
        create: { ...day, shopId: shop.id },
        update: {
            openTime: day.openTime,
            closeTime: day.closeTime,
            isClosed: day.isClosed,
        },
    })));
    return prisma_1.db.shopBusinessHour.findMany({
        where: { shopId: shop.id },
        orderBy: { dayOfWeek: "asc" },
    });
};
exports.updateBusinessHoursService = updateBusinessHoursService;
