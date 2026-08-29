import { redisConnection } from "@/config/redis";
import { staffListCacheKey } from "@/cache/cacheKeys";
import { clearStaffListCache } from "@/cache/cacheInvalidation";
import { db } from "@/db/prisma";
import crypto from "crypto";
import { hashToken, getExpiresAt } from "@/utils/jwt";
import { ShopRole } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";
import {
  SEND_STAFF_INVITE_EMAIL_JOB,
  staffInviteQueue,
} from "@/queues/staff-invite.queue";
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
  if (!shop) throw new ApiError(404, "Shop không tồn tại");
  const existingUser = await db.user.findUnique({
    where: { email: invitedEmail },
  });
  if (existingUser) {
    const alreadyStaff = await db.shopStaff.findFirst({
      where: { shopId: shop.id, userId: existingUser.id, isActive: true },
    });
    if (alreadyStaff)
      throw new ApiError(400, "Email này đã là nhân viên của shop");
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
    include: { shop: true },
  });
  if (!invite) throw new ApiError(404, "Lời mời không tồn tại");
  if (invite.expiresAt < new Date())
    throw new ApiError(400, "Lời mời đã hết hạn");
  if (invite.isUsed) throw new ApiError(400, "Lời mời đã được sử dụng");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User không tồn tại");
  if (user.email !== invite.email) throw new ApiError(400, "Email không khớp");
  await db.shopStaff.create({
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
  await db.user.update({
    where: { id: userId },
    data: { role: "SHOP_MEMBER" },
  });
  await db.shopInvite.update({
    where: { id: invite.id },
    data: { isUsed: true },
  });
  try {
    await clearStaffListCache(invite.shop.slug);
  } catch (error) {
    console.error("[Redis] staff cache invalidation failed after invite acceptance:", error);
  }
  return {
    message: `Đã tham gia ${invite.shop.name} với vai trò ${invite.role}`,
  };
};
export const updateStaffInfoService = async (
  shopSlug: string,
  staffId: string,
  data: { role?: ShopRole; isActive?: boolean },
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop không tồn tại");
  if (data.role && !Object.values(ShopRole).includes(data.role)) {
    throw new ApiError(400, `Role không hợp lệ: ${data.role}`);
  }
  const staff = await db.shopStaff.findFirst({
    where: { id: staffId, shopId: shop.id },
  });
  if (!staff) throw new ApiError(404, "Nhân viên không tồn tại trong shop");
  const updatedStaff = await db.shopStaff.update({
    where: { id: staff.id },
    data,
  });

  try {
    await clearStaffListCache(shopSlug);
  } catch (error) {
    console.error("[Redis] staff cache invalidation failed:", error);
  }

  return updatedStaff;
};
export const updateStaffScheduleService = async (
  shopSlug: string,
  staffId: string,
  data: {
    schedule: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOff: boolean;
    }[];
  },
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop không tồn tại");
  const result = await db.staffSchedule.updateMany({
    where: { shopStaffId: staffId },
    data,
  });
  try {
    await clearStaffListCache(shopSlug);
  } catch (error) {
    console.error("[Redis] staff cache invalidation failed after schedule update:", error);
  }
  return result;
};
export const getStaffScheduleService = async (
  shopSlug: string,
  staffId: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop không tồn tại");
  return db.staffSchedule.findMany({
    where: { shopStaffId: staffId },
  });
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
  if (!shop) throw new ApiError(404, "Shop không tồn tại");

  const cacheKey = staffListCacheKey(shopSlug, query);
  try {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      console.log(`[Redis] staff cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error("[Redis] staff cache read failed:", error);
  }

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
      schedule: { orderBy: { dayOfWeek: "asc" }, take: 1 },
    },
  });

  const result = { items, total, page: safePage, limit, totalPages };
  try {
    await redisConnection.set(cacheKey, JSON.stringify(result), "EX", 3600);
    console.log(`[Redis] staff cache stored: ${cacheKey}`);
  } catch (error) {
    console.error("[Redis] staff cache write failed:", error);
  }

  return result;
};
