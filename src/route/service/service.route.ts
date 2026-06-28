import { authenticate } from '@/middleware/authenticate.middleware';
import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import categoryRouter from './category.route';
import addonRouter from './addon.route';
import servicePackageRouter from './servicePackage.route';
import {
  createServiceController,
  getSerivceController,
  getServiceByIdController,
  updateServiceController,
} from '@/controller/service/service.controller';
import {
  createServiceSchema,
  updateServiceSchema,
} from '@/validation/service.validate';
import serviceOptionRouter from './serviceOption.route';
const serviceRouter = Router({ mergeParams: true });
serviceRouter.post(
  '/',
  validate({ body: createServiceSchema }),
  createServiceController
);
serviceRouter.get('/', getSerivceController);
serviceRouter.use(categoryRouter);
serviceRouter.use('/addons', addonRouter);
serviceRouter.use('/packages', servicePackageRouter);
serviceRouter.use('/:serviceId/options', serviceOptionRouter);
serviceRouter.get('/:serviceId', getServiceByIdController);
serviceRouter.patch(
  '/:serviceId',
  validate({ body: updateServiceSchema }),
  updateServiceController
);

export default serviceRouter;
