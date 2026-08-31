"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markRead = exports.getListNotification = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const getListNotification = async (shopSlug, query = {}) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where = { shopId: shop.id };
    const total = await prisma_1.db.notification.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const items = await prisma_1.db.notification.findMany({
        where,
        skip: (safePage - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
    });
    return { items, meta: { total, page: safePage, limit, totalPages, hasNext: safePage < totalPages, hasPrev: safePage > 1 } };
};
exports.getListNotification = getListNotification;
const markRead = async (id) => {
    return await prisma_1.db.notification.update({
        where: {
            id,
        },
        data: {
            isRead: true,
        },
    });
};
exports.markRead = markRead;
const deleteNotification = async (id) => {
    const noti = await prisma_1.db.notification.findUnique({ where: { id } });
    if (!noti)
        throw new ApiError_1.ApiError(404, 'Notification not found');
    return await prisma_1.db.notification.delete({ where: { id } });
};
exports.deleteNotification = deleteNotification;
