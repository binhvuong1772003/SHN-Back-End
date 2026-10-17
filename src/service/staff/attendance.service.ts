import crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { AttendanceStatus, Prisma } from "@prisma/client";
import { db } from "@/db/prisma";
import { redisConnection } from "@/config/redis";
import { ApiError } from "@/utils/ApiError";
import type {
  AdjustAttendanceInput,
  ManualAttendanceInput,
} from "@/validation/attendance.validate";
import { REDIS_QR_TTL_SECONDS, redisKey } from "@/cache/cacheConfig";

dayjs.extend(utc);
dayjs.extend(timezone);

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

type AttendanceAction = "CHECK_IN" | "CHECK_OUT";
type ShopWithHours = Prisma.ShopGetPayload<{
  include: { businessHours: true };
}>;

interface QrPayload {
  shopId: string;
  action: AttendanceAction;
  nonce: string;
  exp: number;
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getQrSecret = () => {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new ApiError(500, "QR_SECRET is not configured");
  return secret;
};

const getShop = async (shopSlug: string): Promise<ShopWithHours> => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    include: { businessHours: true },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  return shop;
};

const getShopDayRange = (shop: ShopWithHours, date?: string) => {
  const localDate = date
    ? dayjs.tz(date, shop.timezone)
    : dayjs().tz(shop.timezone);
  return {
    localDate,
    start: localDate.startOf("day").toDate(),
    end: localDate.endOf("day").toDate(),
  };
};

const getStaffByUserId = async (
  shop: ShopWithHours,
  userId: string,
) => {
  const staff = await db.shopStaff.findFirst({
    where: { shopId: shop.id, userId, isActive: true },
  });
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");
  return staff;
};

const getStaffById = async (shop: ShopWithHours, staffId: string) => {
  const staff = await db.shopStaff.findFirst({
    where: { id: staffId, shopId: shop.id, isActive: true },
  });
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");
  return staff;
};

const getEffectiveSchedule = async (
  shop: ShopWithHours,
  staffId: string,
) => {
  const { localDate, start, end } = getShopDayRange(shop);
  const dayOfWeek = localDate.day();
  const businessHour = shop.businessHours.find(
    (item) => item.dayOfWeek === dayOfWeek,
  );
  const legacyWorkDays = shop.workDays.map((day) => (day === 7 ? 0 : day));
  const shopIsClosed = businessHour
    ? businessHour.isClosed
    : !legacyWorkDays.includes(dayOfWeek);

  if (shopIsClosed) {
    throw new ApiError(400, "The shop is closed today");
  }

  const schedule = await db.staffSchedule.findUnique({
    where: { shopStaffId_dayOfWeek: { shopStaffId: staffId, dayOfWeek } },
  });
  if (!schedule || schedule.isOff) {
    throw new ApiError(400, "Today is not a scheduled workday for this staff member");
  }

  const approvedOffDay = await db.staffOffDay.findFirst({
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
    throw new ApiError(400, "Today is not a scheduled workday for this staff member");
  }

  return { localDate, date: start, schedule };
};

const signQrPayload = (payload: QrPayload) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", getQrSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
};

const verifyQrToken = async (
  token: string,
  shopId: string,
  expectedAction: AttendanceAction,
) => {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    throw new ApiError(400, "QR code is invalid or has expired");
  }

  const expectedSignature = crypto
    .createHmac("sha256", getQrSecret())
    .update(encodedPayload)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new ApiError(400, "QR code is invalid or has expired");
  }

  let payload: QrPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as QrPayload;
  } catch {
    throw new ApiError(400, "QR code is invalid or has expired");
  }

  if (
    payload.shopId !== shopId ||
    payload.action !== expectedAction ||
    payload.exp <= Date.now()
  ) {
    throw new ApiError(400, "QR code is invalid or has expired");
  }

  const storedNonce = await redisConnection.get(
    redisKey("attendance", "qr", payload.nonce),
  );
  if (storedNonce !== `${shopId}:${expectedAction}`) {
    throw new ApiError(400, "QR code is invalid or has expired");
  }
};

const generateQr = async (
  shopSlug: string,
  action: AttendanceAction,
) => {
  const shop = await getShop(shopSlug);
  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + REDIS_QR_TTL_SECONDS * 1000;
  const payload: QrPayload = { shopId: shop.id, action, nonce, exp: expiresAt };
  const qrToken = signQrPayload(payload);

  await redisConnection.set(
    redisKey("attendance", "qr", nonce),
    `${shop.id}:${action}`,
    "EX",
    REDIS_QR_TTL_SECONDS,
  );

  const path = action === "CHECK_IN" ? "check-in" : "check-out";
  const url = `${FRONTEND_URL}/${shopSlug}/${path}?token=${encodeURIComponent(qrToken)}`;
  const QRCode = await import("qrcode");
  const qrImage = await QRCode.default.toDataURL(url);
  return { qrImage, expiresAt: new Date(expiresAt).toISOString() };
};

export const generateCheckInQRService = (shopSlug: string) =>
  generateQr(shopSlug, "CHECK_IN");

export const generateCheckOutQRService = (shopSlug: string) =>
  generateQr(shopSlug, "CHECK_OUT");

const checkInForStaff = async (shop: ShopWithHours, staffId: string) => {
  const { localDate, date, schedule } = await getEffectiveSchedule(
    shop,
    staffId,
  );
  const nowMinutes = localDate.hour() * 60 + localDate.minute();
  const scheduledStart = timeToMinutes(schedule.startTime);
  const scheduledEnd = timeToMinutes(schedule.endTime);
  const earlyCheckInMinutes = shop.settings?.earlyCheckInMinutes ?? 30;
  const graceMinutes = shop.settings?.attendanceGraceMinutes ?? 5;

  if (
    nowMinutes < scheduledStart - earlyCheckInMinutes ||
    nowMinutes > scheduledEnd
  ) {
    throw new ApiError(400, "Check-in is outside the allowed time window");
  }

  const existing = await db.attendance.findUnique({
    where: { shopStaffId_date: { shopStaffId: staffId, date } },
  });
  if (existing?.checkIn) throw new ApiError(400, "Already checked in");

  const checkIn = new Date();
  const isLate = nowMinutes > scheduledStart + graceMinutes;
  const lateMinutes = isLate ? Math.max(0, nowMinutes - scheduledStart) : 0;

  return db.attendance.upsert({
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

const checkOutForStaff = async (shop: ShopWithHours, staffId: string) => {
  const { localDate, start: date } = getShopDayRange(shop);
  const attendance = await db.attendance.findUnique({
    where: { shopStaffId_date: { shopStaffId: staffId, date } },
  });
  if (!attendance?.checkIn) throw new ApiError(400, "Check-in is required first");
  if (attendance.checkOut) throw new ApiError(400, "Already checked out");

  const schedule = await db.staffSchedule.findUnique({
    where: {
      shopStaffId_dayOfWeek: {
        shopStaffId: staffId,
        dayOfWeek: localDate.day(),
      },
    },
  });
  if (schedule) {
    const latestCheckOut =
      timeToMinutes(schedule.endTime) +
      (shop.settings?.lateCheckOutMinutes ?? 30);
    const nowMinutes = localDate.hour() * 60 + localDate.minute();
    if (nowMinutes > latestCheckOut) {
      throw new ApiError(400, "Check-out is outside the allowed time window");
    }
  }

  const checkOut = new Date();
  const workMinutes = Math.max(
    0,
    Math.floor((checkOut.getTime() - attendance.checkIn.getTime()) / 60000),
  );
  return db.attendance.update({
    where: { id: attendance.id },
    data: { checkOut, workMinutes },
  });
};

export const qrCheckInService = async (
  qrToken: string,
  shopSlug: string,
  userId: string,
) => {
  const shop = await getShop(shopSlug);
  await verifyQrToken(qrToken, shop.id, "CHECK_IN");
  const staff = await getStaffByUserId(shop, userId);
  return checkInForStaff(shop, staff.id);
};

export const qrCheckOutService = async (
  qrToken: string,
  shopSlug: string,
  userId: string,
) => {
  const shop = await getShop(shopSlug);
  await verifyQrToken(qrToken, shop.id, "CHECK_OUT");
  const staff = await getStaffByUserId(shop, userId);
  return checkOutForStaff(shop, staff.id);
};

export const manualAttendanceService = async (
  shopSlug: string,
  input: ManualAttendanceInput,
  actorUserId: string,
  ipAddress?: string,
) => {
  const shop = await getShop(shopSlug);
  const staff = await getStaffById(shop, input.staffId);
  const recordedAttendance =
    input.action === "CHECK_IN"
      ? await checkInForStaff(shop, staff.id)
      : await checkOutForStaff(shop, staff.id);
  const attendance = await db.attendance.update({
    where: { id: recordedAttendance.id },
    data: { recordedBy: actorUserId },
  });

  await db.auditLog.create({
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

export const getMyTodayAttendanceService = async (
  shopSlug: string,
  userId: string,
) => {
  const shop = await getShop(shopSlug);
  const staff = await getStaffByUserId(shop, userId);
  const { start: date } = getShopDayRange(shop);
  return db.attendance.findUnique({
    where: { shopStaffId_date: { shopStaffId: staff.id, date } },
  });
};

const getDateFilter = (
  shop: ShopWithHours,
  from?: string,
  to?: string,
) => {
  const current = dayjs().tz(shop.timezone);
  const start = from
    ? dayjs.tz(from, shop.timezone).startOf("day")
    : current.startOf("month");
  const end = to
    ? dayjs.tz(to, shop.timezone).endOf("day")
    : current.endOf("day");
  return { gte: start.toDate(), lte: end.toDate() };
};

export const getMyAttendanceHistoryService = async (
  shopSlug: string,
  userId: string,
  query: { from?: string; to?: string; page?: number; limit?: number },
) => {
  const shop = await getShop(shopSlug);
  const staff = await getStaffByUserId(shop, userId);
  const where = {
    shopStaffId: staff.id,
    date: getDateFilter(shop, query.from, query.to),
  };
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const total = await db.attendance.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = await db.attendance.findMany({
    where,
    skip: (safePage - 1) * limit,
    take: limit,
    orderBy: { date: "desc" },
  });
  return { items, meta: { total, page: safePage, limit, totalPages, hasNext: safePage < totalPages, hasPrev: safePage > 1 } };
};

export const getShopAttendanceService = async (
  shopSlug: string,
  query: { date?: string; from?: string; to?: string; staffId?: string; page?: number; limit?: number },
) => {
  const shop = await getShop(shopSlug);
  const date = query.date
    ? {
        gte: dayjs.tz(query.date, shop.timezone).startOf("day").toDate(),
        lte: dayjs.tz(query.date, shop.timezone).endOf("day").toDate(),
      }
    : getDateFilter(shop, query.from, query.to);

  const where = {
    date,
    shopStaff: { shopId: shop.id },
    ...(query.staffId ? { shopStaffId: query.staffId } : {}),
  };
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const total = await db.attendance.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = await db.attendance.findMany({
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

export const adjustAttendanceService = async (
  shopSlug: string,
  attendanceId: string,
  input: AdjustAttendanceInput,
  actorUserId: string,
  ipAddress?: string,
) => {
  const shop = await getShop(shopSlug);
  const existing = await db.attendance.findUnique({
    where: { id: attendanceId },
    include: { shopStaff: true },
  });
  if (!existing || existing.shopStaff.shopId !== shop.id) {
    throw new ApiError(404, "Attendance record not found");
  }

  const checkIn = input.checkIn === undefined ? existing.checkIn : input.checkIn;
  const checkOut =
    input.checkOut === undefined ? existing.checkOut : input.checkOut;
  if (checkIn && checkOut && checkOut < checkIn) {
    throw new ApiError(400, "Check-out time must be after check-in time");
  }
  const workMinutes =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000),
        )
      : 0;

  const updated = await db.attendance.update({
    where: { id: existing.id },
    data: {
      checkIn,
      checkOut,
      workMinutes,
      status: input.status as AttendanceStatus | undefined,
      note: input.note,
      recordedBy: actorUserId,
    },
  });

  await db.auditLog.create({
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
