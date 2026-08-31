"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustAttendanceService = exports.getShopAttendanceService = exports.getMyAttendanceHistoryService = exports.getMyTodayAttendanceService = exports.manualAttendanceService = exports.qrCheckOutService = exports.qrCheckInService = exports.generateCheckOutQRService = exports.generateCheckInQRService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const prisma_1 = require("@/db/prisma");
const redis_1 = require("@/config/redis");
const ApiError_1 = require("@/utils/ApiError");
const cacheConfig_1 = require("@/cache/cacheConfig");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};
const getQrSecret = () => {
    const secret = process.env.QR_SECRET;
    if (!secret)
        throw new ApiError_1.ApiError(500, "QR_SECRET is not configured");
    return secret;
};
const getShop = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
        include: { businessHours: true },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return shop;
};
const getShopDayRange = (shop, date) => {
    const localDate = date
        ? dayjs_1.default.tz(date, shop.timezone)
        : (0, dayjs_1.default)().tz(shop.timezone);
    return {
        localDate,
        start: localDate.startOf("day").toDate(),
        end: localDate.endOf("day").toDate(),
    };
};
const getStaffByUserId = async (shop, userId) => {
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { shopId: shop.id, userId, isActive: true },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    return staff;
};
const getStaffById = async (shop, staffId) => {
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId: shop.id, isActive: true },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    return staff;
};
const getEffectiveSchedule = async (shop, staffId) => {
    const { localDate, start, end } = getShopDayRange(shop);
    const dayOfWeek = localDate.day();
    const businessHour = shop.businessHours.find((item) => item.dayOfWeek === dayOfWeek);
    const legacyWorkDays = shop.workDays.map((day) => (day === 7 ? 0 : day));
    const shopIsClosed = businessHour
        ? businessHour.isClosed
        : !legacyWorkDays.includes(dayOfWeek);
    if (shopIsClosed) {
        throw new ApiError_1.ApiError(400, "The shop is closed today");
    }
    const schedule = await prisma_1.db.staffSchedule.findUnique({
        where: { shopStaffId_dayOfWeek: { shopStaffId: staffId, dayOfWeek } },
    });
    if (!schedule || schedule.isOff) {
        throw new ApiError_1.ApiError(400, "Today is not a scheduled workday for this staff member");
    }
    const approvedOffDay = await prisma_1.db.staffOffDay.findFirst({
        where: {
            shopStaffId: staffId,
            status: "APPROVED",
            OR: [
                { offDate: { gte: start, lte: end }, offDateEnd: null },
                { offDate: { lte: end }, offDateEnd: { gte: start } },
            ],
        },
    });
    if (approvedOffDay) {
        throw new ApiError_1.ApiError(400, "Today is not a scheduled workday for this staff member");
    }
    return { localDate, date: start, schedule };
};
const signQrPayload = (payload) => {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto_1.default
        .createHmac("sha256", getQrSecret())
        .update(encodedPayload)
        .digest("base64url");
    return `${encodedPayload}.${signature}`;
};
const verifyQrToken = async (token, shopId, expectedAction) => {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
        throw new ApiError_1.ApiError(400, "QR code is invalid or has expired");
    }
    const expectedSignature = crypto_1.default
        .createHmac("sha256", getQrSecret())
        .update(encodedPayload)
        .digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (actualBuffer.length !== expectedBuffer.length ||
        !crypto_1.default.timingSafeEqual(actualBuffer, expectedBuffer)) {
        throw new ApiError_1.ApiError(400, "QR code is invalid or has expired");
    }
    let payload;
    try {
        payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    }
    catch {
        throw new ApiError_1.ApiError(400, "QR code is invalid or has expired");
    }
    if (payload.shopId !== shopId ||
        payload.action !== expectedAction ||
        payload.exp <= Date.now()) {
        throw new ApiError_1.ApiError(400, "QR code is invalid or has expired");
    }
    const storedNonce = await redis_1.redisConnection.get((0, cacheConfig_1.redisKey)("attendance", "qr", payload.nonce));
    if (storedNonce !== `${shopId}:${expectedAction}`) {
        throw new ApiError_1.ApiError(400, "QR code is invalid or has expired");
    }
};
const generateQr = async (shopSlug, action) => {
    const shop = await getShop(shopSlug);
    const nonce = crypto_1.default.randomUUID();
    const expiresAt = Date.now() + cacheConfig_1.REDIS_QR_TTL_SECONDS * 1000;
    const payload = { shopId: shop.id, action, nonce, exp: expiresAt };
    const qrToken = signQrPayload(payload);
    await redis_1.redisConnection.set((0, cacheConfig_1.redisKey)("attendance", "qr", nonce), `${shop.id}:${action}`, "EX", cacheConfig_1.REDIS_QR_TTL_SECONDS);
    const path = action === "CHECK_IN" ? "check-in" : "check-out";
    const url = `${FRONTEND_URL}/${shopSlug}/${path}?token=${encodeURIComponent(qrToken)}`;
    const QRCode = await Promise.resolve().then(() => __importStar(require("qrcode")));
    const qrImage = await QRCode.default.toDataURL(url);
    return { qrImage, expiresAt: new Date(expiresAt).toISOString() };
};
const generateCheckInQRService = (shopSlug) => generateQr(shopSlug, "CHECK_IN");
exports.generateCheckInQRService = generateCheckInQRService;
const generateCheckOutQRService = (shopSlug) => generateQr(shopSlug, "CHECK_OUT");
exports.generateCheckOutQRService = generateCheckOutQRService;
const checkInForStaff = async (shop, staffId) => {
    const { localDate, date, schedule } = await getEffectiveSchedule(shop, staffId);
    const nowMinutes = localDate.hour() * 60 + localDate.minute();
    const scheduledStart = timeToMinutes(schedule.startTime);
    const scheduledEnd = timeToMinutes(schedule.endTime);
    const earlyCheckInMinutes = shop.settings?.earlyCheckInMinutes ?? 30;
    const graceMinutes = shop.settings?.attendanceGraceMinutes ?? 5;
    if (nowMinutes < scheduledStart - earlyCheckInMinutes ||
        nowMinutes > scheduledEnd) {
        throw new ApiError_1.ApiError(400, "Check-in is outside the allowed time window");
    }
    const existing = await prisma_1.db.attendance.findUnique({
        where: { shopStaffId_date: { shopStaffId: staffId, date } },
    });
    if (existing?.checkIn)
        throw new ApiError_1.ApiError(400, "Already checked in");
    const checkIn = new Date();
    const isLate = nowMinutes > scheduledStart + graceMinutes;
    const lateMinutes = isLate ? Math.max(0, nowMinutes - scheduledStart) : 0;
    return prisma_1.db.attendance.upsert({
        where: { shopStaffId_date: { shopStaffId: staffId, date } },
        create: {
            shopStaffId: staffId,
            date,
            checkIn,
            status: isLate ? "LATE" : "PRESENT",
            lateMinutes,
        },
        update: {
            checkIn,
            status: isLate ? "LATE" : "PRESENT",
            lateMinutes,
        },
    });
};
const checkOutForStaff = async (shop, staffId) => {
    const { localDate, start: date } = getShopDayRange(shop);
    const attendance = await prisma_1.db.attendance.findUnique({
        where: { shopStaffId_date: { shopStaffId: staffId, date } },
    });
    if (!attendance?.checkIn)
        throw new ApiError_1.ApiError(400, "Check-in is required first");
    if (attendance.checkOut)
        throw new ApiError_1.ApiError(400, "Already checked out");
    const schedule = await prisma_1.db.staffSchedule.findUnique({
        where: {
            shopStaffId_dayOfWeek: {
                shopStaffId: staffId,
                dayOfWeek: localDate.day(),
            },
        },
    });
    if (schedule) {
        const latestCheckOut = timeToMinutes(schedule.endTime) +
            (shop.settings?.lateCheckOutMinutes ?? 30);
        const nowMinutes = localDate.hour() * 60 + localDate.minute();
        if (nowMinutes > latestCheckOut) {
            throw new ApiError_1.ApiError(400, "Check-out is outside the allowed time window");
        }
    }
    const checkOut = new Date();
    const workMinutes = Math.max(0, Math.floor((checkOut.getTime() - attendance.checkIn.getTime()) / 60000));
    return prisma_1.db.attendance.update({
        where: { id: attendance.id },
        data: { checkOut, workMinutes },
    });
};
const qrCheckInService = async (qrToken, shopSlug, userId) => {
    const shop = await getShop(shopSlug);
    await verifyQrToken(qrToken, shop.id, "CHECK_IN");
    const staff = await getStaffByUserId(shop, userId);
    return checkInForStaff(shop, staff.id);
};
exports.qrCheckInService = qrCheckInService;
const qrCheckOutService = async (qrToken, shopSlug, userId) => {
    const shop = await getShop(shopSlug);
    await verifyQrToken(qrToken, shop.id, "CHECK_OUT");
    const staff = await getStaffByUserId(shop, userId);
    return checkOutForStaff(shop, staff.id);
};
exports.qrCheckOutService = qrCheckOutService;
const manualAttendanceService = async (shopSlug, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    const staff = await getStaffById(shop, input.staffId);
    const recordedAttendance = input.action === "CHECK_IN"
        ? await checkInForStaff(shop, staff.id)
        : await checkOutForStaff(shop, staff.id);
    const attendance = await prisma_1.db.attendance.update({
        where: { id: recordedAttendance.id },
        data: { recordedBy: actorUserId },
    });
    await prisma_1.db.auditLog.create({
        data: {
            shopId: shop.id,
            userId: actorUserId,
            action: `ATTENDANCE_${input.action}_MANUAL`,
            entity: "Attendance",
            entityId: attendance.id,
            changes: { staffId: staff.id, reason: input.reason },
            ipAddress,
        },
    });
    return attendance;
};
exports.manualAttendanceService = manualAttendanceService;
const getMyTodayAttendanceService = async (shopSlug, userId) => {
    const shop = await getShop(shopSlug);
    const staff = await getStaffByUserId(shop, userId);
    const { start: date } = getShopDayRange(shop);
    return prisma_1.db.attendance.findUnique({
        where: { shopStaffId_date: { shopStaffId: staff.id, date } },
    });
};
exports.getMyTodayAttendanceService = getMyTodayAttendanceService;
const getDateFilter = (shop, from, to) => {
    const current = (0, dayjs_1.default)().tz(shop.timezone);
    const start = from
        ? dayjs_1.default.tz(from, shop.timezone).startOf("day")
        : current.startOf("month");
    const end = to
        ? dayjs_1.default.tz(to, shop.timezone).endOf("day")
        : current.endOf("day");
    return { gte: start.toDate(), lte: end.toDate() };
};
const getMyAttendanceHistoryService = async (shopSlug, userId, query) => {
    const shop = await getShop(shopSlug);
    const staff = await getStaffByUserId(shop, userId);
    const where = {
        shopStaffId: staff.id,
        date: getDateFilter(shop, query.from, query.to),
    };
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const total = await prisma_1.db.attendance.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const items = await prisma_1.db.attendance.findMany({
        where,
        skip: (safePage - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
    });
    return { items, meta: { total, page: safePage, limit, totalPages, hasNext: safePage < totalPages, hasPrev: safePage > 1 } };
};
exports.getMyAttendanceHistoryService = getMyAttendanceHistoryService;
const getShopAttendanceService = async (shopSlug, query) => {
    const shop = await getShop(shopSlug);
    const date = query.date
        ? {
            gte: dayjs_1.default.tz(query.date, shop.timezone).startOf("day").toDate(),
            lte: dayjs_1.default.tz(query.date, shop.timezone).endOf("day").toDate(),
        }
        : getDateFilter(shop, query.from, query.to);
    const where = {
        date,
        shopStaff: { shopId: shop.id },
        ...(query.staffId ? { shopStaffId: query.staffId } : {}),
    };
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const total = await prisma_1.db.attendance.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const items = await prisma_1.db.attendance.findMany({
        where,
        skip: (safePage - 1) * limit,
        take: limit,
        include: {
            shopStaff: {
                include: { user: { select: { name: true, email: true } } },
            },
        },
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    });
    return { items, meta: { total, page: safePage, limit, totalPages, hasNext: safePage < totalPages, hasPrev: safePage > 1 } };
};
exports.getShopAttendanceService = getShopAttendanceService;
const adjustAttendanceService = async (shopSlug, attendanceId, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.attendance.findUnique({
        where: { id: attendanceId },
        include: { shopStaff: true },
    });
    if (!existing || existing.shopStaff.shopId !== shop.id) {
        throw new ApiError_1.ApiError(404, "Attendance record not found");
    }
    const checkIn = input.checkIn === undefined ? existing.checkIn : input.checkIn;
    const checkOut = input.checkOut === undefined ? existing.checkOut : input.checkOut;
    if (checkIn && checkOut && checkOut < checkIn) {
        throw new ApiError_1.ApiError(400, "Check-out time must be after check-in time");
    }
    const workMinutes = checkIn && checkOut
        ? Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000))
        : 0;
    const updated = await prisma_1.db.attendance.update({
        where: { id: existing.id },
        data: {
            checkIn,
            checkOut,
            workMinutes,
            status: input.status,
            note: input.note,
            recordedBy: actorUserId,
        },
    });
    await prisma_1.db.auditLog.create({
        data: {
            shopId: shop.id,
            userId: actorUserId,
            action: "ATTENDANCE_ADJUSTED",
            entity: "Attendance",
            entityId: existing.id,
            changes: {
                reason: input.reason,
                before: {
                    checkIn: existing.checkIn?.toISOString() ?? null,
                    checkOut: existing.checkOut?.toISOString() ?? null,
                    status: existing.status,
                    note: existing.note,
                },
                after: {
                    checkIn: updated.checkIn?.toISOString() ?? null,
                    checkOut: updated.checkOut?.toISOString() ?? null,
                    status: updated.status,
                    note: updated.note,
                },
            },
            ipAddress,
        },
    });
    return updated;
};
exports.adjustAttendanceService = adjustAttendanceService;
