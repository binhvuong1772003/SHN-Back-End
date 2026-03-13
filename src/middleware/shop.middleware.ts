import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { db } from '@/db/prisma';
import { ShopRole } from '@prisma/client';

export const requireShopAccess =
  (minRole: ShopRole = 'STAFF') =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shopSlug = req.params.shopSlug as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) throw new ApiError(401, 'Unauthorized');

      // SUPER_ADMIN - query DB verify
      if (userRole === 'SUPER_ADMIN') {
        const user = await db.user.findUnique({
          where: { id: userId, isActive: true },
        });
        if (!user) throw new ApiError(403, 'Forbidden');
        return next();
      }

      // SHOP_MEMBER - check ShopRole trong shop cụ thể
      if (userRole === 'SHOP_MEMBER') {
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

        if (!shopStaff) throw new ApiError(403, 'Forbidden');

        // Check đủ quyền không
        const roleLevel: Record<ShopRole, number> = {
          STAFF: 1,
          MANAGER: 2,
          OWNER: 3,
        };

        if (roleLevel[shopStaff.role] < roleLevel[minRole]) {
          throw new ApiError(403, 'Không đủ quyền');
        }

        req.shop = shopStaff.shop;
        req.shopStaff = shopStaff;
        return next();
      }

      throw new ApiError(403, 'Forbidden');
    } catch (err) {
      next(err);
    }
  };
