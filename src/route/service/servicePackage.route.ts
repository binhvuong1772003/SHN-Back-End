// route/service/servicePackage.route.ts
import { Router } from 'express';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { validate } from '@/middleware/validation.middleware';
import { idParamSchema } from '@/validation/common.validate';
import { createServicePackageSchema, updateServicePackageSchema } from '@/validation/service.validate';
import {
  createServicePackageController,
  getServicePackagesController,
  getServicePackageByIdController,
  updateServicePackageController,
  deleteServicePackageController,
} from '@/controller/service/servicePackage.controller';

const servicePackageRouter = Router({ mergeParams: true });

servicePackageRouter.get(
  '/',
  requireShopAccess(),
  getServicePackagesController
);
servicePackageRouter.get(
  '/:packageId',
  requireShopAccess(),
  validate({ params: idParamSchema('packageId') }),
  getServicePackageByIdController
);
servicePackageRouter.post(
  '/',
  requireShopAccess('MANAGER'),
  validate({ body: createServicePackageSchema }),
  createServicePackageController
);
servicePackageRouter.patch(
  '/:packageId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('packageId'), body: updateServicePackageSchema }),
  updateServicePackageController
);
servicePackageRouter.delete(
  '/:packageId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('packageId') }),
  deleteServicePackageController
);

export default servicePackageRouter;
