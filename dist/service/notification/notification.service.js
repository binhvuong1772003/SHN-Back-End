"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markRead = exports.getListNotification = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const getListNotification = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    return await prisma_1.db.notification.findMany({
        where: {
            shopId: shop.id,
        },
    });
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
        throw new ApiError_1.ApiError(404, 'Notification không tồn tại');
    return await prisma_1.db.notification.delete({ where: { id } });
};
exports.deleteNotification = deleteNotification;
