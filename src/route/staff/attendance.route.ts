import { authenticate } from '@/middleware/authenticate.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { Router } from 'express';
import {
  checkInController,
  qrCheckInController,
  getCheckInQRController,
  getCheckOutQRController,
  qrCheckOutController,
} from '@/controller/staff/attendace.controller';
import { validate } from '@/middleware/validation.middleware';
const attandanceRouter = Router({ mergeParams: true });
attandanceRouter.use(authenticate);
attandanceRouter.patch('/check-in', checkInController);
attandanceRouter.get('/qr/check-in', authenticate, getCheckInQRController);
attandanceRouter.get('/qr/check-out', authenticate, getCheckOutQRController);
attandanceRouter.post('/qr-check-in', qrCheckInController);
attandanceRouter.post('/qr-check-out', qrCheckOutController);

export default attandanceRouter;
