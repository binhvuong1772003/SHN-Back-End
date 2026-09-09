"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicShopReviews = exports.getPublicShopAvailability = exports.getPublicShopBySlug = exports.getPublicMarketplaceShops = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const calendar_service_1 = require("../../service/calendar/calendar.service");
const getPublicMarketplaceShops = async (query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(24, Math.max(1, Number(query.limit) || 12));
    const search = query.search?.trim();
    const city = query.city?.trim();
    const where = {
        status: "ACTIVE",
        ...(city
            ? {
                OR: [
                    { city: { contains: city, mode: "insensitive" } },
                    { district: { contains: city, mode: "insensitive" } },
                    { address: { contains: city, mode: "insensitive" } },
                ],
            }
            : {}),
        ...(search
            ? {
                AND: [
                    {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { description: { contains: search, mode: "insensitive" } },
                            {
                                services: {
                                    some: {
                                        isActive: true,
                                        OR: [
                                            { name: { contains: search, mode: "insensitive" } },
                                            { description: { contains: search, mode: "insensitive" } },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                ],
            }
            : {}),
    };
    const [items, total] = await Promise.all([
        prisma_1.db.shop.findMany({
            where,
            orderBy: [{ createdAt: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                address: true,
                city: true,
                district: true,
                logoUrl: true,
                coverUrl: true,
                timezone: true,
                description: true,
                services: {
                    where: { isActive: true },
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
                    take: 8,
                    select: {
                        id: true,
                        shopId: true,
                        categoryId: true,
                        name: true,
                        description: true,
                        basePrice: true,
                        durationMin: true,
                        imageUrl: true,
                        isActive: true,
                        sortOrder: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        }),
        prisma_1.db.shop.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        items,
        meta: {
            total,
            page: totalPages > 0 ? Math.min(page, totalPages) : 1,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};
exports.getPublicMarketplaceShops = getPublicMarketplaceShops;
/**
 * Public shop projection. Keep this separate from the authenticated shop
 * detail endpoint so private/customer/operational fields never cross the
 * public boundary.
 */
const getPublicShopBySlug = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findFirst({
        where: { slug: shopSlug, status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            district: true,
            description: true,
            logoUrl: true,
            coverUrl: true,
            openTime: true,
            closeTime: true,
            workDays: true,
            timezone: true,
            businessHours: {
                orderBy: { dayOfWeek: "asc" },
                select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true },
            },
            services: {
                where: { isActive: true },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
                select: {
                    id: true,
                    shopId: true,
                    categoryId: true,
                    name: true,
                    description: true,
                    basePrice: true,
                    durationMin: true,
                    imageUrl: true,
                    isActive: true,
                    sortOrder: true,
                    createdAt: true,
                    updatedAt: true,
                    options: {
                        orderBy: { sortOrder: "asc" },
                        select: {
                            id: true,
                            serviceId: true,
                            name: true,
                            isRequired: true,
                            sortOrder: true,
                            values: {
                                where: { isActive: true },
                                orderBy: { sortOrder: "asc" },
                                select: { id: true, name: true, price: true, duration: true, sortOrder: true },
                            },
                        },
                    },
                },
            },
            staffMembers: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    nickname: true,
                    bio: true,
                    avatarUrl: true,
                    user: { select: { name: true, avatarUrl: true } },
                },
            },
            reviews: {
                where: { isPublic: true },
                orderBy: { createdAt: "desc" },
                take: 8,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    replyContent: true,
                    repliedAt: true,
                    createdAt: true,
                    customer: { select: { name: true, avatarUrl: true } },
                },
            },
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const rating = await prisma_1.db.review.aggregate({
        where: { shopId: shop.id, isPublic: true },
        _avg: { rating: true },
        _count: { _all: true },
    });
    return {
        ...shop,
        rating: {
            average: rating._avg.rating ?? null,
            count: rating._count._all,
        },
    };
};
exports.getPublicShopBySlug = getPublicShopBySlug;
const getPublicShopAvailability = async (input) => {
    // Reuse the same slot validation used at booking time. The public endpoint
    // only exposes availability; the create endpoint still revalidates before
    // writing an appointment.
    return (0, calendar_service_1.getAvailableSlots)(input);
};
exports.getPublicShopAvailability = getPublicShopAvailability;
const getPublicShopReviews = async (shopSlug, query = {}) => {
    const shop = await prisma_1.db.shop.findFirst({
        where: { slug: shopSlug, status: "ACTIVE" },
        select: { id: true },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 8));
    const where = { shopId: shop.id, isPublic: true };
    const [total, items] = await Promise.all([
        prisma_1.db.review.count({ where }),
        prisma_1.db.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                rating: true,
                comment: true,
                replyContent: true,
                repliedAt: true,
                createdAt: true,
                customer: { select: { name: true, avatarUrl: true } },
            },
        }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    return {
        items,
        meta: {
            total,
            page: safePage,
            limit,
            totalPages,
            hasNext: safePage < totalPages,
            hasPrev: safePage > 1,
        },
    };
};
exports.getPublicShopReviews = getPublicShopReviews;
