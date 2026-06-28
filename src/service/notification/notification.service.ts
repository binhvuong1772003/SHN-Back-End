import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
export const getListNotification = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  return await db.notification.findMany({
    where: {
      shopId: shop.id,
    },
  });
};
export const markRead = async (id: string) => {
  return await db.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
    },
  });
};
export const deleteNotification = async (id: string) => {
  const noti = await db.notification.findUnique({ where: { id } });
  if (!noti) throw new ApiError(404, 'Notification không tồn tại');
  return await db.notification.delete({ where: { id } });
};
