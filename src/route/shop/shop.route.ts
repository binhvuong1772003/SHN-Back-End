import { authenticate } from '@/middleware/authenticate.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { createShopSchema } from '@/validation/shop.validate';
import {
  createShopController,
  getShopDetailController,
  uploadShopLogoController,
  updateShopController,
  getListShopController,
} from '@/controller/shop/shop.controller';
import { upload } from '@/middleware/upload.middleware';
import staffRouter from '../staff/staff.route';
import attendanceRouter from '../staff/attendance.route';
import serviceRouter from '../service/service.route';
const shopRouter = Router();
shopRouter.use(authenticate);
shopRouter.post(
  '/shops',
  validate({ body: createShopSchema }),
  createShopController
);
shopRouter.get('/shops', getListShopController);
shopRouter.get('/:shopSlug', requireShopAccess(), getShopDetailController);
shopRouter.patch(
  '/:shopSlug',
  requireShopAccess('OWNER'),
  updateShopController
);
shopRouter.patch(
  '/:shopSlug/logo',
  requireShopAccess('OWNER'),
  upload.single('logo'),
  uploadShopLogoController
);
shopRouter.use('/:shopSlug/staff', staffRouter);
shopRouter.use('/:shopSlug/attendance', attendanceRouter);
shopRouter.use('/:shopSlug/services', serviceRouter);
export default shopRouter;
