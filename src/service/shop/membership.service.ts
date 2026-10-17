import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";

export interface CurrentShopMembership {
  id: string;
  shopId: string;
  userId: string;
  staffId: string | null;
  role: "OWNER" | "ADMIN" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
}

export const getCurrentShopMembershipService = async (
  shopSlug: string,
  userId: string,
): Promise<CurrentShopMembership> => {
  if (!userId) throw new ApiError(401, "Unauthorized");

  const membership = await db.shopStaff.findFirst({
    where: {
      userId,
      shop: { slug: shopSlug },
    },
    select: {
      id: true,
      shopId: true,
      userId: true,
      role: true,
      isActive: true,
    },
  });

  if (!membership) {
    throw new ApiError(404, "Membership not found in this shop");
  }

  return {
    id: membership.id,
    shopId: membership.shopId,
    userId: membership.userId,
    // ShopStaff is both the membership and staff profile in the current schema.
    staffId: membership.id,
    role: membership.role === "MANAGER" ? "ADMIN" : membership.role,
    status: membership.isActive ? "ACTIVE" : "INACTIVE",
  };
};
