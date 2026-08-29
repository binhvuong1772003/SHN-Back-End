"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailOffDayService = exports.getListOffDayService = exports.responseOffDayService = exports.requestOffDayService = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const client_1 = require("@prisma/client");
const socket_1 = require("@/socket");
const requestOffDayService = async (shopSlug, staffId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const staff = await prisma_1.db.shopStaff.findUnique({
        where: { id: staffId },
        include: {
            user: {
                select: { name: true, id: true },
            },
        },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Staff không tồn tại');
    const managers = await prisma_1.db.shopStaff.findMany({
        where: { shopId: shop.id, OR: [{ role: 'MANAGER' }, { role: 'OWNER' }] },
    });
    console.log(managers);
    const offDay = await prisma_1.db.staffOffDay.create({
        data: {
            ...data,
            shopStaffId: staffId,
            status: client_1.OffDayStatus.PENDING,
        },
    });
    const dateMessage = offDay.offDateEnd
        ? `từ ${offDay.offDate.toLocaleDateString()} đến ${offDay.offDateEnd.toLocaleDateString()}`
        : `ngày ${offDay.offDate.toLocaleDateString()}`;
    console.log('🔌 Connected sockets:', (0, socket_1.getIO)().sockets.adapter.rooms);
    const notifications = await Promise.all(managers.map((m) => prisma_1.db.notification.create({
        data: {
            title: 'Yêu cầu nghỉ',
            content: `${staff?.user.name} xin nghỉ ${dateMessage}`,
            type: 'OFF_DAY_REQUEST',
            channel: 'PUSH',
            shopId: shop.id,
            userId: m.userId,
        },
    })));
    (0, socket_1.getIO)()
        .to(`shop:${shop.id}`)
        .emit('off_day_request', {
        offDayId: offDay.id,
        message: `${staff?.user.name} xin nghỉ ${dateMessage}`,
        notificationId: notifications[0].id,
    });
    return offDay;
};
exports.requestOffDayService = requestOffDayService;
const responseOffDayService = async (offDayId, data) => {
    const result = await prisma_1.db.staffOffDay.update({
        where: { id: offDayId },
        data,
    });
    const message = data.status === 'APPROVED'
        ? 'Đơn xin nghỉ được duyệt'
        : `Đơn xin nghỉ bị từ chối. Lí do: ${data.rejectReason}`;
    const staffInfo = await prisma_1.db.shopStaff.findUnique({
        where: { id: result.shopStaffId },
        select: { userId: true },
    });
    (0, socket_1.getIO)().to(staffInfo.userId).emit('off_day_response', {
        offDayId: result.id,
        status: data.status,
        message,
    });
    return result;
};
exports.responseOffDayService = responseOffDayService;
const getListOffDayService = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const result = await prisma_1.db.staffOffDay.findMany({
        where: { shopStaff: { shopId: shop.id } },
        include: { shopStaff: { include: { user: { select: { name: true } } } } },
    });
    return result;
};
exports.getListOffDayService = getListOffDayService;
const getDetailOffDayService = async (offDayId) => {
    const result = await prisma_1.db.staffOffDay.findUnique({
        where: { id: offDayId },
        include: {
            shopStaff: {
                include: { user: { select: { name: true } } },
            },
        },
    });
    if (!result)
        throw new ApiError_1.ApiError(404, 'Không tìm thấy đơn xin nghỉ');
    return result;
};
exports.getDetailOffDayService = getDetailOffDayService;
