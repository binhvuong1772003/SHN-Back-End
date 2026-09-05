import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";

export interface StaffSearchResult {
  staffId: string;
  name: string;
  nickname: string | null;
  role: "OWNER" | "MANAGER" | "STAFF";
}

export const findStaffByNameService = async (
  shopSlug: string,
  staffName: string,
  limit = 5,
): Promise<StaffSearchResult[]> => {
  const search = staffName.trim();
  if (!search) {
    throw new ApiError(400, "Staff name is required");
  }

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const safeLimit = Math.min(Math.max(limit, 1), 5);
  const staffMembers = await db.shopStaff.findMany({
    where: {
      shopId: shop.id,
      isActive: true,
      OR: [
        { nickname: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ],
    },
    orderBy: { joinedAt: "asc" },
    take: safeLimit,
    select: {
      id: true,
      nickname: true,
      role: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return staffMembers.map((staff) => ({
    staffId: staff.id,
    name: staff.user.name,
    nickname: staff.nickname,
    role: staff.role,
  }));
};
