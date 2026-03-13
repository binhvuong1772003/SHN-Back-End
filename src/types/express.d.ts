// types/express.d.ts
import { Shop, ShopStaff } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
      shop?: Shop;
      shopStaff?: ShopStaff;
    }
  }
}
