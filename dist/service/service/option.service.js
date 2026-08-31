"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceOption = exports.updateServiceOptionController = exports.getServiceOptionById = exports.getServiceOptions = exports.createServiceOption = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const createServiceOption = async (data, shopSlug, serviceId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: {
            slug: shopSlug,
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const service = await prisma_1.db.service.findUnique({
        where: {
            id: serviceId,
            shopId: shop.id,
        },
    });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found");
    const { values, ...rest } = data;
    const result = await prisma_1.db.serviceOption.create({
        data: {
            serviceId,
            ...rest,
            values: { create: data.values },
        },
        include: { values: true },
    });
    return result;
};
exports.createServiceOption = createServiceOption;
const getServiceOptions = async (serviceId, shopSlug) => {
    console.log(shopSlug);
    const shop = await prisma_1.db.shop.findUnique({
        where: {
            slug: shopSlug,
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const service = await prisma_1.db.service.findUnique({
        where: {
            id: serviceId,
            shopId: shop.id,
        },
    });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found");
    const result = await prisma_1.db.serviceOption.findMany({
        where: {
            serviceId,
        },
        include: { values: true },
    });
    return result;
};
exports.getServiceOptions = getServiceOptions;
const getServiceOptionById = async (optionId, shopSlug, serviceId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: {
            slug: shopSlug,
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const service = await prisma_1.db.service.findUnique({
        where: {
            id: serviceId,
            shopId: shop.id,
        },
    });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found");
    const option = await prisma_1.db.serviceOption.findUnique({
        where: {
            id: optionId,
        },
        include: { values: true },
    });
    if (!option)
        throw new ApiError_1.ApiError(404, "Option not found");
    return option;
};
exports.getServiceOptionById = getServiceOptionById;
const updateServiceOptionController = async (data, shopSlug, serviceId, optionId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: {
            slug: shopSlug,
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const service = await prisma_1.db.service.findUnique({
        where: {
            id: serviceId,
            shopId: shop.id,
        },
    });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found");
    const option = await prisma_1.db.serviceOption.findUnique({
        where: {
            id: optionId,
            serviceId,
        },
    });
    if (!option)
        throw new ApiError_1.ApiError(404, "Option not found");
    const { values: _values, ...optionData } = data;
    void _values;
    const result = await prisma_1.db.serviceOption.update({
        where: { id: optionId },
        data: optionData,
        include: { values: true },
    });
    return result;
};
exports.updateServiceOptionController = updateServiceOptionController;
const deleteServiceOption = async (shopSlug, serviceId, optionId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: {
            slug: shopSlug,
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const service = await prisma_1.db.service.findUnique({
        where: {
            id: serviceId,
            shopId: shop.id,
        },
    });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found");
    const option = await prisma_1.db.serviceOption.findUnique({
        where: {
            id: optionId,
            serviceId,
        },
    });
    if (!option)
        throw new ApiError_1.ApiError(404, "Option not found");
    const result = await prisma_1.db.serviceOption.delete({
        where: {
            id: optionId,
        },
    });
    return result;
};
exports.deleteServiceOption = deleteServiceOption;
