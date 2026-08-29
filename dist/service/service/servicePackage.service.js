"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServicePackage = exports.updateServicePackage = exports.getServicePackageById = exports.getServicePackages = exports.createServicePackage = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const createServicePackage = async (data, shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const { items, addons, ...packageData } = data;
    const result = await prisma_1.db.servicePackage.create({
        data: {
            ...packageData,
            shopId: shop.id,
            items: {
                create: items.map((item) => ({
                    serviceId: item.serviceId,
                    optionValueId: item.optionValueId,
                    isIncluded: item.isIncluded ?? true,
                })),
            },
            addons: addons
                ? {
                    create: addons.map((addon) => ({
                        addonId: addon.addonId, // ← đổi từ optionValueId sang addonId
                        extraPrice: addon.extraPrice,
                    })),
                }
                : undefined,
        },
        include: {
            items: {
                include: {
                    service: true,
                    optionValue: true,
                },
            },
            addons: {
                include: { addon: true }, // ← đổi từ optionValue sang addon
            },
        },
    });
    return result;
};
exports.createServicePackage = createServicePackage;
const getServicePackages = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    return prisma_1.db.servicePackage.findMany({
        where: { shopId: shop.id },
        include: {
            items: {
                include: {
                    service: true,
                    optionValue: true,
                },
            },
            addons: {
                include: { addon: true },
            },
        },
    });
};
exports.getServicePackages = getServicePackages;
const getServicePackageById = async (shopSlug, packageId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const result = await prisma_1.db.servicePackage.findUnique({
        where: { id: packageId },
        include: {
            items: {
                include: {
                    service: true,
                    optionValue: true,
                },
            },
            addons: {
                include: { addon: true },
            },
        },
    });
    if (!result || result.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, 'Package không tồn tại');
    }
    return result;
};
exports.getServicePackageById = getServicePackageById;
const updateServicePackage = async (shopSlug, packageId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const existing = await prisma_1.db.servicePackage.findUnique({
        where: { id: packageId },
    });
    if (!existing || existing.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, 'Package không tồn tại');
    }
    const { items, addons, ...packageData } = data;
    await prisma_1.db.$transaction(async (tx) => {
        if (Object.keys(packageData).length > 0) {
            await tx.servicePackage.update({
                where: { id: packageId },
                data: packageData,
            });
        }
        if (items) {
            await tx.servicePackageItem.deleteMany({ where: { packageId } });
            await tx.servicePackageItem.createMany({
                data: items.map((item) => ({
                    packageId,
                    serviceId: item.serviceId,
                    optionValueId: item.optionValueId,
                    isIncluded: item.isIncluded ?? true,
                })),
            });
        }
        if (addons) {
            await tx.packageAddon.deleteMany({ where: { packageId } });
            await tx.packageAddon.createMany({
                data: addons.map((addon) => ({
                    packageId,
                    addonId: addon.addonId,
                    extraPrice: addon.extraPrice,
                })),
            });
        }
    });
    return prisma_1.db.servicePackage.findUnique({
        where: { id: packageId },
        include: {
            items: { include: { service: true, optionValue: true } },
            addons: { include: { addon: true } },
        },
    });
};
exports.updateServicePackage = updateServicePackage;
const deleteServicePackage = async (shopSlug, packageId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const existing = await prisma_1.db.servicePackage.findUnique({
        where: { id: packageId },
    });
    if (!existing || existing.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, 'Package không tồn tại');
    }
    return prisma_1.db.servicePackage.delete({ where: { id: packageId } });
};
exports.deleteServicePackage = deleteServicePackage;
