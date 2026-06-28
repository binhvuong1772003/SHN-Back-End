// route/service/serviceOption.route.ts
import { Router } from 'express';
import { requireShopAccess } from '@/middleware/shop.middleware';
import {
  createServiceOptionController,
  getServiceOptionsController,
  getServiceOptionByIdController,
  updateServiceOptionCtrl,
  deleteServiceOptionController,
} from '@/controller/service/serviceOption.controller';

const serviceOptionRouter = Router({ mergeParams: true });

serviceOptionRouter.get('/', requireShopAccess(), getServiceOptionsController);
serviceOptionRouter.get(
  '/:optionId',
  requireShopAccess(),
  getServiceOptionByIdController
);
serviceOptionRouter.post(
  '/',
  requireShopAccess('MANAGER'),
  createServiceOptionController
);
serviceOptionRouter.patch(
  '/:optionId',
  requireShopAccess('MANAGER'),
  updateServiceOptionCtrl
);
serviceOptionRouter.delete(
  '/:optionId',
  requireShopAccess('MANAGER'),
  deleteServiceOptionController
);

export default serviceOptionRouter;
