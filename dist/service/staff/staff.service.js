"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffListByShopService = exports.getStaffScheduleService = exports.updateStaffScheduleService = exports.updateStaffInfoService = exports.acceptInviteService = exports.inviteStaffService = void 0;
const prisma_1 = require("@/db/prisma");
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("@/utils/jwt");
const client_1 = require("@prisma/client");
const ApiError_1 = require("@/utils/ApiError");
const staff_invite_queue_1 = require("@/queues/staff-invite.queue");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const inviteStaffService = async (shopSlug, invitedEmail, role, invitedBy) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const existingUser = await prisma_1.db.user.findUnique({
        where: { email: invitedEmail },
    });
    if (existingUser) {
        const alreadyStaff = await prisma_1.db.shopStaff.findFirst({
            where: { shopId: shop.id, userId: existingUser.id, isActive: true },
        });
        if (alreadyStaff)
            throw new ApiError_1.ApiError(400, "Email này đã là nhân viên của shop");
    }
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = (0, jwt_1.getExpiresAt)("1h");
    const invite = await prisma_1.db.shopInvite.create({
        data: {
            shopId: shop.id,
            email: invitedEmail,
            role: role,
            token: (0, jwt_1.hashToken)(rawToken),
            expiresAt,
        },
    });
    const hasAccount = !!existingUser;
    // Keep both values in the link: the accept API is scoped to a shop.
    const inviteURL = `${FRONTEND_URL}/invite/accept?token=${encodeURIComponent(rawToken)}&shopSlug=${encodeURIComponent(shop.slug)}`;
    try {
        await staff_invite_queue_1.staffInviteQueue.add(staff_invite_queue_1.SEND_STAFF_INVITE_EMAIL_JOB, {
            inviteId: invite.id,
            email: invitedEmail,
            shopName: shop.name,
            role,
            inviteUrl: inviteURL,
            expiresAt: expiresAt.toISOString(),
        }, { jobId: `staff-invite-${invite.id}` });
    }
    catch (error) {
        await prisma_1.db.shopInvite.delete({ where: { id: invite.id } });
        throw error;
    }
    return {
        message: "Invitation queued successfully",
        token: rawToken,
        inviteURL,
    };
};
exports.inviteStaffService = inviteStaffService;
const acceptInviteService = async (rawToken, userId) => {
    const invite = await prisma_1.db.shopInvite.findUnique({
        where: { token: (0, jwt_1.hashToken)(rawToken) },
        include: { shop: true },
    });
    if (!invite)
        throw new ApiError_1.ApiError(404, "Lời mời không tồn tại");
    if (invite.expiresAt < new Date())
        throw new ApiError_1.ApiError(400, "Lời mời đã hết hạn");
    if (invite.isUsed)
        throw new ApiError_1.ApiError(400, "Lời mời đã được sử dụng");
    const user = await prisma_1.db.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new ApiError_1.ApiError(404, "User không tồn tại");
    if (user.email !== invite.email)
        throw new ApiError_1.ApiError(400, "Email không khớp");
    await prisma_1.db.shopStaff.create({
        data: {
            shopId: invite.shopId,
            userId: user.id,
            role: invite.role,
            schedule: {
                create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
                    dayOfWeek: day,
                    startTime: "08:00",
                    endTime: "17:00",
                    isOff: false,
                })),
            },
        },
    });
    await prisma_1.db.user.update({
        where: { id: userId },
        data: { role: "SHOP_MEMBER" },
    });
    await prisma_1.db.shopInvite.update({
        where: { id: invite.id },
        data: { isUsed: true },
    });
    return {
        message: `Đã tham gia ${invite.shop.name} với vai trò ${invite.role}`,
    };
};
exports.acceptInviteService = acceptInviteService;
const updateStaffInfoService = async (shopSlug, staffId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    if (data.role && !Object.values(client_1.ShopRole).includes(data.role)) {
        throw new ApiError_1.ApiError(400, `Role không hợp lệ: ${data.role}`);
    }
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId: shop.id },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Nhân viên không tồn tại trong shop");
    return prisma_1.db.shopStaff.update({
        where: { id: staff.id },
        data,
    });
};
exports.updateStaffInfoService = updateStaffInfoService;
const updateStaffScheduleService = async (shopSlug, staffId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    return prisma_1.db.staffSchedule.updateMany({
        where: { shopStaffId: staffId },
        data,
    });
};
exports.updateStaffScheduleService = updateStaffScheduleService;
const getStaffScheduleService = async (shopSlug, staffId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    return prisma_1.db.staffSchedule.findMany({
        where: { shopStaffId: staffId },
    });
};
exports.getStaffScheduleService = getStaffScheduleService;
const getStaffListByShopService = async (shopSlug, query) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop không tồn tại");
    const where = { shopId: shop.id };
    const search = query.search?.trim();
    if (search) {
        where.OR = [
            { nickname: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { phone: { contains: search, mode: "insensitive" } } },
        ];
    }
    if (query.role)
        where.role = query.role;
    if (query.status === "ACTIVE")
        where.isActive = true;
    if (query.status === "INACTIVE")
        where.isActive = false;
    if (query.status === "ON_LEAVE") {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        where.offDays = {
            some: {
                status: "APPROVED",
                offDate: { lte: endOfDay },
                OR: [{ offDateEnd: null }, { offDateEnd: { gte: startOfDay } }],
            },
        };
    }
    const total = await prisma_1.db.shopStaff.count({ where });
    const page = Math.max(1, query.page);
    const limit = Math.min(50, Math.max(1, query.limit));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const orderBy = query.sort === "NAME_ASC"
        ? { nickname: "asc" }
        : query.sort === "NAME_DESC"
            ? { nickname: "desc" }
            : query.sort === "REVENUE"
                ? { totalServiced: "desc" }
                : { joinedAt: "desc" };
    const items = await prisma_1.db.shopStaff.findMany({
        where,
        orderBy,
        skip: (safePage - 1) * limit,
        take: limit,
        include: {
            user: { select: { name: true, email: true, avatarUrl: true } },
            schedule: { orderBy: { dayOfWeek: "asc" }, take: 1 },
        },
    });
    return { items, total, page: safePage, limit, totalPages };
};
exports.getStaffListByShopService = getStaffListByShopService;
