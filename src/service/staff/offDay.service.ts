import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { OffDayStatus } from '@prisma/client';
import { RequestOffDayInput, ResponseOffDayInput } from '@/validation/staff.validate';
import { getIO } from '@/socket';
import { clearStaffListCache, clearStaffScheduleCache } from '@/cache/cacheInvalidation';

export const requestOffDayService = async (shopSlug: string, staffId: string, requesterUserId: string, data: RequestOffDayInput) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const staff = await db.shopStaff.findUnique({ where: { id: staffId }, include: { user: { select: { name: true, id: true } } } });
  if (!staff || staff.shopId !== shop.id) throw new ApiError(404, 'Staff member not found');
  if (staff.userId !== requesterUserId) throw new ApiError(403, 'You cannot submit a leave request for another staff member');
  const managers = await db.shopStaff.findMany({ where: { shopId: shop.id, OR: [{ role: 'MANAGER' }, { role: 'OWNER' }] } });
  const offDay = await db.staffOffDay.create({ data: { ...data, shopStaffId: staffId, status: OffDayStatus.PENDING } });
  try {
    await clearStaffScheduleCache(shop.id, staff.id);
  } catch (error) {
    console.error('[Redis] Staff schedule cache invalidation failed after leave request:', error);
  }
  const dateMessage = offDay.offDateEnd
    ? `from ${offDay.offDate.toLocaleDateString()} to ${offDay.offDateEnd.toLocaleDateString()}`
    : `on ${offDay.offDate.toLocaleDateString()}`;
  const notifications = await Promise.all(managers.map((manager) => db.notification.create({
    data: {
      title: 'Leave request',
      content: `${staff.user.name} requested leave ${dateMessage}`,
      type: 'OFF_DAY_REQUEST',
      channel: 'PUSH',
      shopId: shop.id,
      userId: manager.userId,
    },
  })));
  getIO().to(`shop:${shop.id}`).emit('off_day_request', {
    offDayId: offDay.id,
    message: `${staff.user.name} requested leave ${dateMessage}`,
    notificationId: notifications[0]?.id,
  });
  return offDay;
};

export const responseOffDayService = async (shopSlug: string, offDayId: string, reviewerUserId: string, data: ResponseOffDayInput) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const existing = await db.staffOffDay.findUnique({ where: { id: offDayId }, include: { shopStaff: true } });
  if (!existing || existing.shopStaff.shopId !== shop.id) throw new ApiError(404, 'Leave request not found');
  if (existing.status !== 'PENDING') throw new ApiError(409, 'This leave request has already been processed');
  const result = await db.staffOffDay.update({ where: { id: offDayId }, data: { ...data, approvedBy: reviewerUserId } });
  const message = data.status === 'APPROVED'
    ? 'Leave request approved'
    : `Leave request rejected. Reason: ${data.rejectReason}`;
  const staffInfo = await db.shopStaff.findUnique({ where: { id: result.shopStaffId }, select: { userId: true } });
  try {
    await Promise.all([clearStaffScheduleCache(shop.id, existing.shopStaff.id), clearStaffListCache(shopSlug)]);
  } catch (error) {
    console.error('[Redis] Staff schedule cache invalidation failed after leave update:', error);
  }
  if (staffInfo) getIO().to(staffInfo.userId).emit('off_day_response', { offDayId: result.id, status: data.status, message });
  return result;
};

export const getListOffDayService = async (
  shopSlug: string,
  staffUserId?: string,
  query: { page: number; limit: number; status?: OffDayStatus; staffId?: string } = { page: 1, limit: 10 },
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const baseWhere = { shopStaff: { shopId: shop.id, ...(staffUserId ? { userId: staffUserId } : {}), ...(query.staffId ? { id: query.staffId } : {}) } };
  const where = { ...baseWhere, ...(query.status ? { status: query.status } : {}) };
  const page = Math.max(1, query.page);
  const limit = Math.min(50, Math.max(1, query.limit));
  const [total, groupedCounts] = await Promise.all([
    db.staffOffDay.count({ where }),
    db.staffOffDay.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = await db.staffOffDay.findMany({
    where,
    skip: (safePage - 1) * limit,
    take: limit,
    include: { shopStaff: { include: { user: { select: { name: true, email: true, avatarUrl: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const statusCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const entry of groupedCounts) statusCounts[entry.status] = entry._count._all;
  return { items, meta: { total, page: safePage, limit, totalPages, statusCounts } };
};

export const getDetailOffDayService = async (offDayId: string) => {
  const result = await db.staffOffDay.findUnique({
    where: { id: offDayId },
    include: { shopStaff: { include: { user: { select: { name: true } } } } },
  });
  if (!result) throw new ApiError(404, 'Leave request not found');
  return result;
};
