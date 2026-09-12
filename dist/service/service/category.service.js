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
        throw new ApiError_1.ApiError(404, "Shop not found");
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
const getCategories = async (shopSlug, query = {}) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const search = query.search?.trim();
    const where = {
        shopId: shop.id,
        ...(query.status ? { isActive: query.status === "ACTIVE" } : {}),
        ...(search
            ? { name: { contains: search, mode: "insensitive" } }
            : {}),
    };
    const orderBy = query.sort === "NAME_ASC"
        ? { name: "asc" }
        : query.sort === "NAME_DESC"
            ? { name: "desc" }
            : query.sort === "RECENT"
                ? { createdAt: "desc" }
                : { sortOrder: "asc" };
    const [items, total] = await Promise.all([
        prisma_1.db.serviceCategory.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: { _count: { select: { services: true } } },
        }),
        prisma_1.db.serviceCategory.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        items: items.map(({ _count, ...category }) => ({
            ...category,
            serviceCount: _count.services,
        })),
        total,
        page: totalPages > 0 ? Math.min(page, totalPages) : 1,
        limit,
        totalPages,
    };
};
exports.getCategories = getCategories;
const getCategoryById = async (id) => {
    const result = await prisma_1.db.serviceCategory.findUnique({
        where: { id },
    });
    if (!result)
        throw new ApiError_1.ApiError(404, "Category not found");
    return result;
};
exports.getCategoryById = getCategoryById;
