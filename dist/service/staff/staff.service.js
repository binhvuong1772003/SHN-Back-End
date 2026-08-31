"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffListByShopService = exports.getStaffDetailService = exports.getStaffScheduleService = exports.deleteStaffScheduleService = exports.updateStaffScheduleService = exports.updateStaffInfoService = exports.acceptInviteService = exports.inviteStaffService = void 0;
const cacheKeys_1 = require("@/cache/cacheKeys");
const cacheInvalidation_1 = require("@/cache/cacheInvalidation");
const cacheAside_1 = require("@/cache/cacheAside");
const prisma_1 = require("@/db/prisma");
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("@/utils/jwt");
const client_1 = require("@prisma/client");
const ApiError_1 = require("@/utils/ApiError");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const staff_invite_queue_1 = require("@/queues/staff-invite.queue");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const inviteStaffService = async (shopSlug, invitedEmail, role, invitedBy) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const existingUser = await prisma_1.db.user.findUnique({
        where: { email: invitedEmail },
    });
    if (existingUser) {
        const alreadyStaff = await prisma_1.db.shopStaff.findFirst({
            where: { shopId: shop.id, userId: existingUser.id, isActive: true },
        });
        if (alreadyStaff)
            throw new ApiError_1.ApiError(400, "This email already belongs to a staff member in the shop");
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
        include: { shop: { include: { businessHours: true } } },
    });
    if (!invite)
        throw new ApiError_1.ApiError(404, "Invitation not found");
    if (invite.expiresAt < new Date())
        throw new ApiError_1.ApiError(400, "Invitation has expired");
    if (invite.isUsed)
        throw new ApiError_1.ApiError(400, "Invitation has already been used");
    const user = await prisma_1.db.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (user.email !== invite.email)
        throw new ApiError_1.ApiError(400, "Email does not match the invitation");
    const businessHoursByDay = new Map(invite.shop.businessHours.map((item) => [item.dayOfWeek, item]));
    const shopWorkDays = new Set(invite.shop.workDays.map((day) => (day === 7 ? 0 : day)));
    const defaultSchedule = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
        const businessHour = businessHoursByDay.get(dayOfWeek);
        return {
            dayOfWeek,
            startTime: businessHour?.openTime ?? invite.shop.openTime,
            endTime: businessHour?.closeTime ?? invite.shop.closeTime,
            isOff: businessHour?.isClosed ?? !shopWorkDays.has(dayOfWeek),
        };
    });
    const createdStaff = await prisma_1.db.shopStaff.create({
        data: {
            shopId: invite.shopId,
            userId: user.id,
            role: invite.role,
            schedule: {
                create: defaultSchedule,
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
    try {
        await Promise.all([
            (0, cacheInvalidation_1.clearStaffListCache)(invite.shop.slug),
            (0, cacheInvalidation_1.clearStaffScheduleCache)(invite.shopId, createdStaff.id),
        ]);
    }
    catch (error) {
        console.error("[Redis] staff cache invalidation failed after invite acceptance:", error);
    }
    return {
        message: `Joined ${invite.shop.name} with role ${invite.role}`,
    };
};
exports.acceptInviteService = acceptInviteService;
const updateStaffInfoService = async (shopSlug, staffId, data) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (data.role && !Object.values(client_1.ShopRole).includes(data.role)) {
        throw new ApiError_1.ApiError(400, `Invalid role: ${data.role}`);
    }
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId: shop.id },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    const updatedStaff = await prisma_1.db.shopStaff.update({
        where: { id: staff.id },
        data,
    });
    try {
        await Promise.all([
            (0, cacheInvalidation_1.clearStaffListCache)(shopSlug),
            (0, cacheInvalidation_1.clearStaffScheduleCache)(shop.id, staff.id),
        ]);
    }
    catch (error) {
        console.error("[Redis] staff cache invalidation failed:", error);
    }
    return updatedStaff;
};
exports.updateStaffInfoService = updateStaffInfoService;
const updateStaffScheduleService = async (shopSlug, staffId, schedule) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId: shop.id },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    const result = await prisma_1.db.$transaction(async (tx) => {
        await tx.staffSchedule.deleteMany({ where: { shopStaffId: staff.id } });
        if (schedule.length > 0) {
            await tx.staffSchedule.createMany({
                data: schedule.map((item) => ({ ...item, shopStaffId: staff.id })),
            });
        }
        return tx.staffSchedule.findMany({
            where: { shopStaffId: staff.id },
            orderBy: { dayOfWeek: "asc" },
        });
    });
    try {
        await Promise.all([
            (0, cacheInvalidation_1.clearStaffListCache)(shopSlug),
            (0, cacheInvalidation_1.clearStaffScheduleCache)(shop.id, staff.id),
        ]);
    }
    catch (error) {
        console.error("[Redis] staff cache invalidation failed after schedule update:", error);
    }
    return result;
};
exports.updateStaffScheduleService = updateStaffScheduleService;
const deleteStaffScheduleService = async (shopSlug, staffId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId: shop.id },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    const result = await prisma_1.db.staffSchedule.deleteMany({
        where: { shopStaffId: staff.id },
    });
    try {
        await Promise.all([
            (0, cacheInvalidation_1.clearStaffListCache)(shopSlug),
            (0, cacheInvalidation_1.clearStaffScheduleCache)(shop.id, staff.id),
        ]);
    }
    catch (error) {
        console.error("[Redis] staff cache invalidation failed after schedule deletion:", error);
    }
    return result;
};
exports.deleteStaffScheduleService = deleteStaffScheduleService;
const getStaffScheduleService = async (shopSlug, staffId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
        throw new ApiError_1.ApiError(400, "Invalid staffId");
    }
    const cacheKey = (0, cacheKeys_1.staffScheduleCacheKey)(shop.id, staffId);
    return (0, cacheAside_1.cacheAside)(cacheKey, async () => {
        const staff = await prisma_1.db.shopStaff.findFirst({
            where: { id: staffId, shopId: shop.id },
            select: {
                id: true,
                schedule: { orderBy: { dayOfWeek: "asc" } },
                offDays: {
                    where: { status: { in: ["PENDING", "APPROVED"] } },
                    orderBy: { offDate: "asc" },
                },
            },
        });
        if (!staff)
            throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
        return {
            shopId: shop.id,
            staffId: staff.id,
            schedule: staff.schedule,
            offDays: staff.offDays,
        };
    });
};
exports.getStaffScheduleService = getStaffScheduleService;
const getStaffDetailService = async (shopSlug, staffId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
        throw new ApiError_1.ApiError(400, "Invalid staffId");
    }
    const today = (0, dayjs_1.default)().tz(shop.timezone);
    const start = today.startOf("day").toDate();
    const end = today.endOf("day").toDate();
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId: shop.id },
        include: {
            user: {
                select: { name: true, email: true, avatarUrl: true },
            },
            schedule: {
                where: { dayOfWeek: today.day() },
                take: 1,
            },
            offDays: {
                where: {
                    status: "APPROVED",
                    OR: [
                        { offDate: { gte: start, lte: end }, offDateEnd: null },
                        { offDate: { lte: end }, offDateEnd: { gte: start } },
                    ],
                },
                select: { id: true },
                take: 1,
            },
        },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    const { schedule, offDays, ...profile } = staff;
    const isOnLeave = offDays.length > 0;
    const todaySchedule = schedule[0];
    return {
        ...profile,
        schedule: !isOnLeave && todaySchedule && !todaySchedule.isOff
            ? todaySchedule
            : null,
        isOnLeave,
    };
};
exports.getStaffDetailService = getStaffDetailService;
const getStaffListByShopService = async (shopSlug, query) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const today = (0, dayjs_1.default)().tz(shop.timezone);
    const todayStart = today.startOf("day").toDate();
    const todayEnd = today.endOf("day").toDate();
    const todayDayOfWeek = today.day();
    const cacheKey = (0, cacheKeys_1.staffListCacheKey)(shopSlug, query, today.format("YYYY-MM-DD"));
    return (0, cacheAside_1.cacheAside)(cacheKey, async () => {
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
            where.offDays = {
                some: {
                    status: "APPROVED",
                    OR: [
                        {
                            offDate: { gte: todayStart, lte: todayEnd },
                            offDateEnd: null,
                        },
                        {
                            offDate: { lte: todayEnd },
                            offDateEnd: { gte: todayStart },
                        },
                    ],
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
                schedule: { where: { dayOfWeek: todayDayOfWeek }, take: 1 },
                offDays: {
                    where: {
                        status: "APPROVED",
                        OR: [
                            {
                                offDate: { gte: todayStart, lte: todayEnd },
                                offDateEnd: null,
                            },
                            {
                                offDate: { lte: todayEnd },
                                offDateEnd: { gte: todayStart },
                            },
                        ],
                    },
                    select: { id: true },
                    take: 1,
                },
            },
        });
        const normalizedItems = items.map(({ schedule, offDays, ...staff }) => {
            const todaySchedule = schedule[0];
            const isOnLeave = offDays.length > 0;
            return {
                ...staff,
                schedule: !isOnLeave && todaySchedule && !todaySchedule.isOff
                    ? todaySchedule
                    : null,
                isOnLeave,
            };
        });
        return {
            items: normalizedItems,
            total,
            page: safePage,
            limit,
            totalPages,
        };
    });
};
exports.getStaffListByShopService = getStaffListByShopService;
