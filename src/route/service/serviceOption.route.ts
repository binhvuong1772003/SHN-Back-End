// route/service/serviceOption.route.ts
import { Router } from 'express';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { validate } from '@/middleware/validation.middleware';
import { idParamSchema } from '@/validation/common.validate';
import { createServiceOptionSchema, updateServiceOptionSchema } from '@/validation/service.validate';
import {
  createServiceOptionController,
  getServiceOptionsController,
  getServiceOptionByIdController,
  updateServiceOptionCtrl,
  deleteServiceOptionController,
} from '@/controller/service/serviceOption.controller';

const serviceOptionRouter = Router({ mergeParams: true });

serviceOptionRouter.use(validate({ params: idParamSchema('serviceId') }));
serviceOptionRouter.get('/', requireShopAccess(), getServiceOptionsController);
serviceOptionRouter.get(
  '/:optionId',
  requireShopAccess(),
  validate({ params: idParamSchema('optionId') }),
  getServiceOptionByIdController
);
serviceOptionRouter.post(
  '/',
  requireShopAccess('MANAGER'),
  validate({ body: createServiceOptionSchema }),
  createServiceOptionController
);
serviceOptionRouter.patch(
  '/:optionId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('optionId'), body: updateServiceOptionSchema }),
  updateServiceOptionCtrl
);
serviceOptionRouter.delete(
  '/:optionId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('optionId') }),
  deleteServiceOptionController
);

export default serviceOptionRouter;
