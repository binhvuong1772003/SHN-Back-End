import { staffListCacheKey, staffScheduleCacheKey } from "@/cache/cacheKeys";
import {
  clearStaffListCache,
  clearStaffScheduleCache,
} from "@/cache/cacheInvalidation";
import { cacheAside } from "@/cache/cacheAside";
import { db } from "@/db/prisma";
import crypto from "crypto";
import { hashToken, getExpiresAt } from "@/utils/jwt";
import { ShopRole, StaffPermission } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  SEND_STAFF_INVITE_EMAIL_JOB,
  staffInviteQueue,
} from "@/queues/staff-invite.queue";
dayjs.extend(utc);
dayjs.extend(timezone);
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const inviteStaffService = async (
  shopSlug: string,
  invitedEmail: string,
  role: ShopRole,
  invitedBy: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  const existingUser = await db.user.findUnique({
    where: { email: invitedEmail },
  });
  if (existingUser) {
    const alreadyStaff = await db.shopStaff.findFirst({
      where: { shopId: shop.id, userId: existingUser.id, isActive: true },
    });
    if (alreadyStaff)
      throw new ApiError(
        400,
        "This email already belongs to a staff member in the shop",
      );
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = getExpiresAt("1h");
  const invite = await db.shopInvite.create({
    data: {
      shopId: shop.id,
      email: invitedEmail,
      role: role,
      token: hashToken(rawToken),
      expiresAt,
    },
  });
  const hasAccount = !!existingUser;
  // Keep both values in the link: the accept API is scoped to a shop.
  const inviteURL = `${FRONTEND_URL}/invite/accept?token=${encodeURIComponent(rawToken)}&shopSlug=${encodeURIComponent(shop.slug)}`;
  try {
    await staffInviteQueue.add(
      SEND_STAFF_INVITE_EMAIL_JOB,
      {
        inviteId: invite.id,
        email: invitedEmail,
        shopName: shop.name,
        role,
        inviteUrl: inviteURL,
        expiresAt: expiresAt.toISOString(),
      },
      { jobId: `staff-invite-${invite.id}` },
    );
  } catch (error) {
    await db.shopInvite.delete({ where: { id: invite.id } });
    throw error;
  }
  return {
    message: "Invitation queued successfully",
    token: rawToken,
    inviteURL,
  };
};
export const acceptInviteService = async (rawToken: string, userId: string) => {
  const invite = await db.shopInvite.findUnique({
    where: { token: hashToken(rawToken) },
    include: { shop: { include: { businessHours: true } } },
  });
  if (!invite) throw new ApiError(404, "Invitation not found");
  if (invite.expiresAt < new Date())
    throw new ApiError(400, "Invitation has expired");
  if (invite.isUsed)
    throw new ApiError(400, "Invitation has already been used");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.email !== invite.email)
    throw new ApiError(400, "Email does not match the invitation");

  const businessHoursByDay = new Map(
    invite.shop.businessHours.map((item) => [item.dayOfWeek, item]),
  );
  const shopWorkDays = new Set(
    invite.shop.workDays.map((day) => (day === 7 ? 0 : day)),
  );
  const defaultSchedule = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
    const businessHour = businessHoursByDay.get(dayOfWeek);
    return {
      dayOfWeek,
      startTime: businessHour?.openTime ?? invite.shop.openTime,
      endTime: businessHour?.closeTime ?? invite.shop.closeTime,
      isOff: businessHour?.isClosed ?? !shopWorkDays.has(dayOfWeek),
    };
  });

  const createdStaff = await db.shopStaff.create({
    data: {
      shopId: invite.shopId,
      userId: user.id,
      role: invite.role,
      schedule: {
        create: defaultSchedule,
      },
    },
  });
  await db.user.update({
    where: { id: userId },
    data: { role: "SHOP_MEMBER" },
  });
  await db.shopInvite.update({
    where: { id: invite.id },
    data: { isUsed: true },
  });
  try {
    await Promise.all([
      clearStaffListCache(invite.shop.slug),
      clearStaffScheduleCache(invite.shopId, createdStaff.id),
    ]);
  } catch (error) {
    console.error(
      "[Redis] staff cache invalidation failed after invite acceptance:",
      error,
    );
  }
  return {
    message: `Joined ${invite.shop.name} with role ${invite.role}`,
  };
};
export const updateStaffInfoService = async (
  shopSlug: string,
  staffId: string,
  data: {
    role?: ShopRole;
    permissions?: StaffPermission[];
    isActive?: boolean;
  },
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  if (data.role && !Object.values(ShopRole).includes(data.role)) {
    throw new ApiError(400, `Invalid role: ${data.role}`);
  }
  const staff = await db.shopStaff.findFirst({
    where: { id: staffId, shopId: shop.id },
  });
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");
  const updatedStaff = await db.shopStaff.update({
    where: { id: staff.id },
    data,
  });

  try {
    await Promise.all([
      clearStaffListCache(shopSlug),
      clearStaffScheduleCache(shop.id, staff.id),
    ]);
  } catch (error) {
    console.error("[Redis] staff cache invalidation failed:", error);
  }

  return updatedStaff;
};
export const updateStaffScheduleService = async (
  shopSlug: string,
  staffId: string,
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOff: boolean;
  }[],
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  const staff = await db.shopStaff.findFirst({
    where: { id: staffId, shopId: shop.id },
  });
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");

  const result = await db.$transaction(async (tx) => {
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
      clearStaffListCache(shopSlug),
      clearStaffScheduleCache(shop.id, staff.id),
    ]);
  } catch (error) {
    console.error(
      "[Redis] staff cache invalidation failed after schedule update:",
      error,
    );
  }
  return result;
};

export const deleteStaffScheduleService = async (
  shopSlug: string,
  staffId: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  const staff = await db.shopStaff.findFirst({
    where: { id: staffId, shopId: shop.id },
  });
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");

  const result = await db.staffSchedule.deleteMany({
    where: { shopStaffId: staff.id },
  });
  try {
    await Promise.all([
      clearStaffListCache(shopSlug),
      clearStaffScheduleCache(shop.id, staff.id),
    ]);
  } catch (error) {
    console.error(
      "[Redis] staff cache invalidation failed after schedule deletion:",
      error,
    );
  }
  return result;
};

export const getStaffScheduleService = async (
  shopSlug: string,
  staffId: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
    throw new ApiError(400, "Invalid staffId");
  }

  const cacheKey = staffScheduleCacheKey(shop.id, staffId);
  return cacheAside(cacheKey, async () => {
    const staff = await db.shopStaff.findFirst({
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
    if (!staff) throw new ApiError(404, "Staff member not found in this shop");

    return {
      shopId: shop.id,
      staffId: staff.id,
      schedule: staff.schedule,
      offDays: staff.offDays,
    };
  });
};

export const getMyStaffScheduleByDateService = async (
  shopSlug: string,
  userId: string,
  date: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const targetDate = dayjs.tz(date, shop.timezone);
  if (!targetDate.isValid() || targetDate.format("YYYY-MM-DD") !== date) {
    throw new ApiError(400, "Invalid date. Expected YYYY-MM-DD");
  }

  const staff = await db.shopStaff.findFirst({
    where: { shopId: shop.id, userId, isActive: true },
    select: { id: true },
  });
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");

  const weeklySchedule = await getStaffScheduleService(shopSlug, staff.id);
  const targetDateKey = targetDate.format("YYYY-MM-DD");
  const isOnLeave = weeklySchedule.offDays.some((offDay) => {
    if (offDay.status !== "APPROVED") return false;
    const offDayStart = dayjs(offDay.offDate)
      .tz(shop.timezone)
      .format("YYYY-MM-DD");
    const offDayEnd = offDay.offDateEnd
      ? dayjs(offDay.offDateEnd).tz(shop.timezone).format("YYYY-MM-DD")
      : offDayStart;
    return targetDateKey >= offDayStart && targetDateKey <= offDayEnd;
  });

  const schedule = weeklySchedule.schedule.find(
    (item) => item.dayOfWeek === targetDate.day(),
  );
  const isWorking = Boolean(schedule && !schedule.isOff && !isOnLeave);

  return {
    date: targetDateKey,
    dayOfWeek: targetDate.day(),
    isWorking,
    isOnLeave,
    schedule: isWorking ? schedule : null,
  };
};

export const getStaffDetailService = async (
  shopSlug: string,
  staffId: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
    throw new ApiError(400, "Invalid staffId");
  }

  const today = dayjs().tz(shop.timezone);
  const start = today.startOf("day").toDate();
  const end = today.endOf("day").toDate();
  const staff = await db.shopStaff.findFirst({
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
  if (!staff) throw new ApiError(404, "Staff member not found in this shop");

  const { schedule, offDays, ...profile } = staff;
  const isOnLeave = offDays.length > 0;
  const todaySchedule = schedule[0];
  return {
    ...profile,
    schedule:
      !isOnLeave && todaySchedule && !todaySchedule.isOff
        ? todaySchedule
        : null,
    isOnLeave,
  };
};
export interface StaffListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: ShopRole;
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  sort?: "RECENT" | "NAME_ASC" | "NAME_DESC" | "REVENUE";
}

export const getStaffListByShopService = async (
  shopSlug: string,
  query: StaffListQuery,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const today = dayjs().tz(shop.timezone);
  const todayStart = today.startOf("day").toDate();
  const todayEnd = today.endOf("day").toDate();
  const todayDayOfWeek = today.day();
  const cacheKey = staffListCacheKey(
    shopSlug,
    query,
    today.format("YYYY-MM-DD"),
  );
  return cacheAside(cacheKey, async () => {
    const where: any = { shopId: shop.id };
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status === "ACTIVE") where.isActive = true;
    if (query.status === "INACTIVE") where.isActive = false;
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

    const total = await db.shopStaff.count({ where });
    const page = Math.max(1, query.page);
    const limit = Math.min(50, Math.max(1, query.limit));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const orderBy =
      query.sort === "NAME_ASC"
        ? { nickname: "asc" as const }
        : query.sort === "NAME_DESC"
          ? { nickname: "desc" as const }
          : query.sort === "REVENUE"
            ? { totalServiced: "desc" as const }
            : { joinedAt: "desc" as const };

    const items = await db.shopStaff.findMany({
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
        schedule:
          !isOnLeave && todaySchedule && !todaySchedule.isOff
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
