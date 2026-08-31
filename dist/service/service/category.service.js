"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryById = exports.getCategories = exports.deleteCategory = exports.updateCategory = exports.createCategory = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const createCategory = async (data, shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
    const result = await prisma_1.db.serviceCategory.create({
        data: {
            shopId: shop.id,
            ...data,
        },
    });
    return result;
};
exports.createCategory = createCategory;
const updateCategory = async (id, data) => {
    const result = await prisma_1.db.serviceCategory.update({
        where: { id },
        data,
    });
    return result;
};
exports.updateCategory = updateCategory;
const deleteCategory = async (id) => {
    const result = await prisma_1.db.serviceCategory.delete({
        where: { id },
    });
    return result;
};
exports.deleteCategory = deleteCategory;
const getCategories = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
    const result = await prisma_1.db.serviceCategory.findMany({
        where: { shopId: shop.id },
    });
    return result;
};
exports.getCategories = getCategories;
const getCategoryById = async (id) => {
    const result = await prisma_1.db.serviceCategory.findUnique({
        where: { id },
    });
    if (!result)
        throw new ApiError_1.ApiError(404, 'Category not found');
    return result;
};
exports.getCategoryById = getCategoryById;
