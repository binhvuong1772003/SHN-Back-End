import { authenticate } from '@/middleware/authenticate.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { createShopSchema, updateShopSchema } from '@/validation/shop.validate';
import {
  createShopController,
  getShopDetailController,
  uploadShopLogoController,
  updateShopController,
  getListShopController,
  uploadShopBannerController,
} from '@/controller/shop/shop.controller';
import { upload } from '@/middleware/upload.middleware';
import staffRouter from '../staff/staff.route';
import attendanceRouter from '../staff/attendance.route';
import serviceRouter from '../service/service.route';
import notiRouter from '../notification/notification.route';
import calendarRouter from '../calendar/calendar.route';
import appointmentRouter from '../appointment/appointment.route';
const shopRouter = Router();
shopRouter.use(authenticate);
shopRouter.post(
  '/',
  validate({ body: createShopSchema }),
  createShopController
);
shopRouter.get('/', getListShopController);
shopRouter.get('/:shopSlug', requireShopAccess(), getShopDetailController);
shopRouter.patch(
  '/:shopSlug',
  requireShopAccess('OWNER'),
  validate({ body: updateShopSchema }),
  updateShopController
);
shopRouter.patch(
  '/:shopSlug/logo',
  requireShopAccess('OWNER'),
  upload.single('logo'),
  uploadShopLogoController
);
shopRouter.patch(
  '/:shopSlug/banner',
  requireShopAccess('OWNER'),
  upload.single('banner'),
  uploadShopBannerController
);
shopRouter.use('/:shopSlug/staff', staffRouter);
shopRouter.use('/:shopSlug/attendance', attendanceRouter);
shopRouter.use('/:shopSlug/services', serviceRouter);
shopRouter.use('/:shopSlug/notifications', notiRouter);
shopRouter.use('/:shopSlug/calendar', calendarRouter);
shopRouter.use('/:shopSlug/appointments', appointmentRouter);
export default shopRouter;
