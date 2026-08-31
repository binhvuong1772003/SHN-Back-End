"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailOffDayService = exports.getListOffDayService = exports.responseOffDayService = exports.requestOffDayService = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const client_1 = require("@prisma/client");
const socket_1 = require("@/socket");
const cacheInvalidation_1 = require("@/cache/cacheInvalidation");
const requestOffDayService = async (shopSlug, staffId, requesterUserId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
    const staff = await prisma_1.db.shopStaff.findUnique({ where: { id: staffId }, include: { user: { select: { name: true, id: true } } } });
    if (!staff || staff.shopId !== shop.id)
        throw new ApiError_1.ApiError(404, 'Staff member not found');
    if (staff.userId !== requesterUserId)
        throw new ApiError_1.ApiError(403, 'You cannot submit a leave request for another staff member');
    const managers = await prisma_1.db.shopStaff.findMany({ where: { shopId: shop.id, OR: [{ role: 'MANAGER' }, { role: 'OWNER' }] } });
    const offDay = await prisma_1.db.staffOffDay.create({ data: { ...data, shopStaffId: staffId, status: client_1.OffDayStatus.PENDING } });
    try {
        await (0, cacheInvalidation_1.clearStaffScheduleCache)(shop.id, staff.id);
    }
    catch (error) {
        console.error('[Redis] Staff schedule cache invalidation failed after leave request:', error);
    }
    const dateMessage = offDay.offDateEnd
        ? `from ${offDay.offDate.toLocaleDateString()} to ${offDay.offDateEnd.toLocaleDateString()}`
        : `on ${offDay.offDate.toLocaleDateString()}`;
    const notifications = await Promise.all(managers.map((manager) => prisma_1.db.notification.create({
        data: {
            title: 'Leave request',
            content: `${staff.user.name} requested leave ${dateMessage}`,
            type: 'OFF_DAY_REQUEST',
            channel: 'PUSH',
            shopId: shop.id,
            userId: manager.userId,
        },
    })));
    (0, socket_1.getIO)().to(`shop:${shop.id}`).emit('off_day_request', {
        offDayId: offDay.id,
        message: `${staff.user.name} requested leave ${dateMessage}`,
        notificationId: notifications[0]?.id,
    });
    return offDay;
};
exports.requestOffDayService = requestOffDayService;
const responseOffDayService = async (shopSlug, offDayId, reviewerUserId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
    const existing = await prisma_1.db.staffOffDay.findUnique({ where: { id: offDayId }, include: { shopStaff: true } });
    if (!existing || existing.shopStaff.shopId !== shop.id)
        throw new ApiError_1.ApiError(404, 'Leave request not found');
    if (existing.status !== 'PENDING')
        throw new ApiError_1.ApiError(409, 'This leave request has already been processed');
    const result = await prisma_1.db.staffOffDay.update({ where: { id: offDayId }, data: { ...data, approvedBy: reviewerUserId } });
    const message = data.status === 'APPROVED'
        ? 'Leave request approved'
        : `Leave request rejected. Reason: ${data.rejectReason}`;
    const staffInfo = await prisma_1.db.shopStaff.findUnique({ where: { id: result.shopStaffId }, select: { userId: true } });
    try {
        await Promise.all([(0, cacheInvalidation_1.clearStaffScheduleCache)(shop.id, existing.shopStaff.id), (0, cacheInvalidation_1.clearStaffListCache)(shopSlug)]);
    }
    catch (error) {
        console.error('[Redis] Staff schedule cache invalidation failed after leave update:', error);
    }
    if (staffInfo)
        (0, socket_1.getIO)().to(staffInfo.userId).emit('off_day_response', { offDayId: result.id, status: data.status, message });
    return result;
};
exports.responseOffDayService = responseOffDayService;
const getListOffDayService = async (shopSlug, staffUserId, query = { page: 1, limit: 10 }) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
    const baseWhere = { shopStaff: { shopId: shop.id, ...(staffUserId ? { userId: staffUserId } : {}), ...(query.staffId ? { id: query.staffId } : {}) } };
    const where = { ...baseWhere, ...(query.status ? { status: query.status } : {}) };
    const page = Math.max(1, query.page);
    const limit = Math.min(50, Math.max(1, query.limit));
    const [total, groupedCounts] = await Promise.all([
        prisma_1.db.staffOffDay.count({ where }),
        prisma_1.db.staffOffDay.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true } }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const items = await prisma_1.db.staffOffDay.findMany({
        where,
        skip: (safePage - 1) * limit,
        take: limit,
        include: { shopStaff: { include: { user: { select: { name: true, email: true, avatarUrl: true } } } } },
        orderBy: { createdAt: 'desc' },
    });
    const statusCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const entry of groupedCounts)
        statusCounts[entry.status] = entry._count._all;
    return { items, meta: { total, page: safePage, limit, totalPages, statusCounts } };
};
exports.getListOffDayService = getListOffDayService;
const getDetailOffDayService = async (offDayId) => {
    const result = await prisma_1.db.staffOffDay.findUnique({
        where: { id: offDayId },
        include: { shopStaff: { include: { user: { select: { name: true } } } } },
    });
    if (!result)
        throw new ApiError_1.ApiError(404, 'Leave request not found');
    return result;
};
exports.getDetailOffDayService = getDetailOffDayService;
