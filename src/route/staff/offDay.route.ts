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
import { idParamSchema, offDayListQuerySchema } from '@/validation/common.validate';
const offDayRouter = Router({ mergeParams: true });
offDayRouter.use(authenticate);
offDayRouter.use(requireShopAccess("STAFF"));
offDayRouter.post(
  '/:staffId/off-days',
  validate({ params: idParamSchema('staffId'), body: requestOffDaySchema }),
  requestOffDayController
);
offDayRouter.get('/off-days', validate({ query: offDayListQuerySchema }), getListOffDayController);
offDayRouter.get('/off-days/:offDayId', validate({ params: idParamSchema('offDayId') }), getDetailDayOffController);
offDayRouter.patch(
  '/off-days/:offDayId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('offDayId'), body: responseOffDaySchema }),
  responseOffDayController,
);
export default offDayRouter;
