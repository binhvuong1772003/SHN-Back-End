// route/service/servicePackage.route.ts
import { Router } from 'express';
import { requireShopAccess } from '@/middleware/shop.middleware';
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
  getServicePackageByIdController
);
servicePackageRouter.post(
  '/',
  requireShopAccess('MANAGER'),
  createServicePackageController
);
servicePackageRouter.patch(
  '/:packageId',
  requireShopAccess('MANAGER'),
  updateServicePackageController
);
servicePackageRouter.delete(
  '/:packageId',
  requireShopAccess('MANAGER'),
  deleteServicePackageController
);

export default servicePackageRouter;
