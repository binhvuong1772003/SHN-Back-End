"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countService = exports.updateService = exports.deleteService = exports.getServiceById = exports.getService = exports.createService = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const createService = async (data, shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const { options, ...serviceFields } = data;
    const result = await prisma_1.db.service.create({
        data: {
            ...serviceFields,
            shopId: shop.id,
            options: options?.length
                ? {
                    create: options.map((option) => ({
                        name: option.name,
                        isRequired: option.isRequired,
                        sortOrder: option.sortOrder,
                        values: {
                            create: option.values.map((v) => ({
                                name: v.name,
                                price: v.price,
                                duration: v.duration,
                            })),
                        },
                    })),
                }
                : undefined,
        },
        include: { options: { include: { values: true } } },
    });
    return result;
};
exports.createService = createService;
const getService = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const result = await prisma_1.db.service.findMany({
        where: {
            shopId: shop.id,
        },
        include: {
            options: {
                include: {
                    values: true,
                },
                orderBy: {
                    sortOrder: "asc",
                },
            },
            addons: true,
        },
    });
    return result;
};
exports.getService = getService;
const getServiceById = async (shopSlug, serviceId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const result = await prisma_1.db.service.findUnique({
        where: {
            id: serviceId,
        },
        include: {
            options: {
                include: {
                    values: true,
                },
                orderBy: {
                    sortOrder: "asc",
                },
            },
            addons: true,
        },
    });
    if (!result || result.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, "Service không tồn tại");
    }
    return result;
};
exports.getServiceById = getServiceById;
const deleteService = async (shopSlug, serviceId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const service = await prisma_1.db.service.findUnique({ where: { id: serviceId } });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service không tồn tại");
    const result = await prisma_1.db.service.delete({
        where: {
            id: serviceId,
        },
    });
    return result;
};
exports.deleteService = deleteService;
const updateService = async (shopSlug, serviceId, data) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const service = await prisma_1.db.service.findUnique({ where: { id: serviceId } });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service không tồn tại");
    const { options, deleteOptionIds, deleteValueIds, addons, deleteAddonIds, ...serviceData } = data;
    await prisma_1.db.$transaction(async (tx) => {
        if (Object.keys(serviceData).length > 0) {
            await tx.service.update({
                where: { id: serviceId },
                data: serviceData,
            });
        }
        if (deleteValueIds && deleteValueIds.length > 0) {
            await tx.optionValue.deleteMany({
                where: {
                    id: { in: deleteValueIds },
                },
            });
        }
        if (deleteOptionIds && deleteOptionIds.length > 0) {
            await tx.serviceOption.deleteMany({
                where: {
                    id: { in: deleteOptionIds },
                    serviceId,
                },
            });
        }
        if (options && options.length > 0) {
            for (const option of options) {
                const { id: optionId, values, ...optionData } = option;
                if (optionId) {
                    await tx.serviceOption.update({
                        where: { id: optionId },
                        data: optionData,
                    });
                    for (const value of values) {
                        const { id: valueId, ...valueData } = value;
                        if (valueId) {
                            await tx.optionValue.update({
                                where: { id: valueId },
                                data: valueData,
                            });
                        }
                        else {
                            await tx.optionValue.create({
                                data: {
                                    ...valueData,
                                    optionId,
                                },
                            });
                        }
                    }
                }
                else {
                    await tx.serviceOption.create({
                        data: {
                            ...optionData,
                            serviceId,
                            values: {
                                create: values.map(({ id, ...v }) => v),
                            },
                        },
                    });
                }
            }
        }
        if (deleteAddonIds && deleteAddonIds.length > 0) {
            await tx.addonService.deleteMany({
                where: {
                    id: { in: deleteAddonIds },
                    serviceId,
                },
            });
        }
        if (addons && addons.length > 0) {
            for (const addon of addons) {
                const { id: addonId, ...addonData } = addon;
                if (addonId) {
                    await tx.addonService.update({
                        where: { id: addonId },
                        data: addonData,
                    });
                }
                else {
                    await tx.addonService.create({
                        data: {
                            ...addonData,
                            serviceId,
                            shopId: shop.id,
                        },
                    });
                }
            }
        }
    });
    const result = await prisma_1.db.service.findUnique({
        where: { id: serviceId },
        include: {
            options: {
                include: { values: true },
                orderBy: { sortOrder: "asc" },
            },
            addons: true,
        },
    });
    return result;
};
exports.updateService = updateService;
const countService = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const count = await prisma_1.db.service.count({
        where: { shopId: shop.id },
    });
    return count;
};
exports.countService = countService;
