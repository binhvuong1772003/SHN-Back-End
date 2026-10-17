import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";
import { db } from "@/db/prisma";
import { ShopRole } from "@prisma/client";

export const requireShopAccess =
  (minRole: ShopRole = "STAFF") =>
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("SHOP ACCESS:", {
      params: req.params,
      shopSlug: req.params.shopSlug,
      userId: req.user?.userId,
      userRole: req.user?.role,
    });
    console.log(req.user?.userId);
    try {
      const shopSlug = req.params.shopSlug as string;
      const userId = req.user?.userId;
      // Read the current role from the database. The role embedded in an old
      // access token can be stale (for example immediately after creating a
      // shop, when the user is promoted to SHOP_MEMBER).
      const user = await db.user.findUnique({
        where: { id: userId, isActive: true },
        select: { role: true },
      });
      if (!user) throw new ApiError(403, "Forbidden");
      const userRole = user.role;
      console.log(userId);
      if (!userId) throw new ApiError(401, "Unauthorized");
      // SUPER_ADMIN - query DB verify
      if (userRole === "SUPER_ADMIN") {
        return next();
      }

      // SHOP_MEMBER - check the role in this specific shop.
      if (userRole === "SHOP_MEMBER") {
        const shopStaff = await db.shopStaff.findFirst({
          where: {
            userId,
            isActive: true,
            shop: { slug: shopSlug },
          },
          include: {
            shop: true,
          },
        });

        if (!shopStaff) throw new ApiError(403, "Forbidden");

        // Check whether the user has sufficient permissions.
        const roleLevel: Record<ShopRole, number> = {
          STAFF: 1,
          MANAGER: 2,
          OWNER: 3,
        };

        if (roleLevel[shopStaff.role] < roleLevel[minRole]) {
          throw new ApiError(403, "Insufficient shop permissions");
        }

        req.shop = shopStaff.shop;
        req.shopStaff = shopStaff;
        return next();
      }

      throw new ApiError(403, "Forbidden");
    } catch (err) {
      next(err);
    }
  };
