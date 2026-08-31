import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { validate } from '@/middleware/validation.middleware';
import { idParamSchema, notificationListQuerySchema } from '@/validation/common.validate';
import {
  getListNotificationController,
  markReadController,
  deleteNotificationController,
} from '@/controller/notification/nofitication.controller';

const notiRouter = Router({ mergeParams: true });
notiRouter.use(authenticate, requireShopAccess("STAFF"));

notiRouter.get('/', validate({ query: notificationListQuerySchema }), getListNotificationController);
notiRouter.patch('/:id', validate({ params: idParamSchema('id') }), markReadController);
notiRouter.delete('/:id', validate({ params: idParamSchema('id') }), deleteNotificationController);
export default notiRouter;
