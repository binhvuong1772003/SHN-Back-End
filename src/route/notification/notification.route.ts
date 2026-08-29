import { Router } from 'express';

import { authenticate } from '@/middleware/authenticate.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { validate } from '@/middleware/validation.middleware';
import { registerSchema } from '@/validation/auth.validate';
import {
  getListNotificationController,
  markReadController,
  deleteNotificationController,
} from '@/controller/notification/nofitication.controller';

const notiRouter = Router({ mergeParams: true });
notiRouter.use(authenticate, requireShopAccess("STAFF"));

notiRouter.get('/', getListNotificationController);
notiRouter.patch('/:id', markReadController);
notiRouter.delete('/:id', deleteNotificationController);
export default notiRouter;
