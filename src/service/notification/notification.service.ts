import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
export const getListNotification = async (
  shopSlug: string,
  userId: string,
  query: { page?: number; limit?: number } = {},
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const where = { shopId: shop.id, userId };
  const total = await db.notification.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = await db.notification.findMany({
    where,
    skip: (safePage - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return { items, meta: { total, page: safePage, limit, totalPages, hasNext: safePage < totalPages, hasPrev: safePage > 1 } };
};
export const markRead = async (shopSlug: string, userId: string, id: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const notification = await db.notification.findFirst({ where: { id, shopId: shop.id, userId } });
  if (!notification) throw new ApiError(404, 'Notification not found');
  return db.notification.update({ where: { id }, data: { isRead: true } });
};
export const deleteNotification = async (shopSlug: string, userId: string, id: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const noti = await db.notification.findFirst({ where: { id, shopId: shop.id, userId } });
  if (!noti) throw new ApiError(404, 'Notification not found');
  return await db.notification.delete({ where: { id } });
};

export const markAllRead = async (shopSlug: string, userId: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  await db.notification.updateMany({
    where: { shopId: shop.id, userId, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
};
