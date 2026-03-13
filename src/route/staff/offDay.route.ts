import { authenticate } from '@/middleware/authenticate.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { Router } from 'express';
import {
  requestOffDayController,
  responseOffDayController,
  getDetailDayOffController,
  getListOffDayController,
} from '@/controller/staff/offDay.controller';
import {
  requestOffDaySchema,
  responseOffDaySchema,
} from '@/validation/staff.validate';
import { validate } from '@/middleware/validation.middleware';
const offDayRouter = Router({ mergeParams: true });
offDayRouter.use(authenticate);
offDayRouter.post(
  '/:staffId/off-days',
  validate({ body: requestOffDaySchema }),
  requestOffDayController
);
offDayRouter.get('/off-days', getListOffDayController);
offDayRouter.get('/off-days/:offDayId', getDetailDayOffController);
offDayRouter.patch('/off-days/:offDayId', responseOffDayController);
export default offDayRouter;
