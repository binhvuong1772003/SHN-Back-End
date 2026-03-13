import { authenticate } from '@/middleware/authenticate.middleware';
import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { requireShopAccess } from '@/middleware/shop.middleware';
import categoryRouter from './category.route';
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
const serviceRouter = Router({ mergeParams: true });
serviceRouter.post(
  '/',
  validate({ body: createServiceSchema }),
  createServiceController
);
serviceRouter.get('/', getSerivceController);
serviceRouter.get('/:serviceId', getServiceByIdController);
serviceRouter.patch(
  '/:serviceId',
  validate({ body: updateServiceSchema }),
  updateServiceController
);
serviceRouter.use(categoryRouter);
export default serviceRouter;
