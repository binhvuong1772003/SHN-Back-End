"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddonService = exports.updateAddonService = exports.getAddonServiceById = exports.getAddonServices = exports.createAddonService = void 0;
// service/addonService.service.ts
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const createAddonService = async (shopSlug, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    // Kiểm tra serviceId nếu có
    if (data.serviceId) {
        const service = await prisma_1.db.service.findUnique({
            where: { id: data.serviceId, shopId: shop.id },
        });
        if (!service)
            throw new ApiError_1.ApiError(404, 'Service không tồn tại');
    }
    return prisma_1.db.addonService.create({
        data: {
            ...data,
            shopId: shop.id,
        },
    });
};
exports.createAddonService = createAddonService;
const getAddonServices = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    return prisma_1.db.addonService.findMany({
        where: { shopId: shop.id },
        include: { service: { select: { id: true, name: true } } },
        orderBy: { sortOrder: 'asc' },
    });
};
exports.getAddonServices = getAddonServices;
const getAddonServiceById = async (shopSlug, addonId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const addon = await prisma_1.db.addonService.findUnique({
        where: { id: addonId },
        include: { service: { select: { id: true, name: true } } },
    });
    if (!addon || addon.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, 'Addon không tồn tại');
    }
    return addon;
};
exports.getAddonServiceById = getAddonServiceById;
const updateAddonService = async (shopSlug, addonId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const addon = await prisma_1.db.addonService.findUnique({ where: { id: addonId } });
    if (!addon || addon.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, 'Addon không tồn tại');
    }
    if (data.serviceId) {
        const service = await prisma_1.db.service.findUnique({
            where: { id: data.serviceId, shopId: shop.id },
        });
        if (!service)
            throw new ApiError_1.ApiError(404, 'Service không tồn tại');
    }
    return prisma_1.db.addonService.update({
        where: { id: addonId },
        data,
        include: { service: { select: { id: true, name: true } } },
    });
};
exports.updateAddonService = updateAddonService;
const deleteAddonService = async (shopSlug, addonId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const addon = await prisma_1.db.addonService.findUnique({ where: { id: addonId } });
    if (!addon || addon.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, 'Addon không tồn tại');
    }
    return prisma_1.db.addonService.delete({ where: { id: addonId } });
};
exports.deleteAddonService = deleteAddonService;
