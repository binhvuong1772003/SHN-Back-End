// route/service/addon.route.ts
import { Router } from 'express';
import { requireShopAccess } from '@/middleware/shop.middleware';
import {
  createAddonController,
  getAddonsController,
  getAddonByIdController,
  updateAddonController,
  deleteAddonController,
} from '@/controller/service/addon.controller';

const addonRouter = Router({ mergeParams: true });

addonRouter.get('/', requireShopAccess(), getAddonsController);
addonRouter.get('/:addonId', requireShopAccess(), getAddonByIdController);
addonRouter.post('/', requireShopAccess('MANAGER'), createAddonController);
addonRouter.patch(
  '/:addonId',
  requireShopAccess('MANAGER'),
  updateAddonController
);
addonRouter.delete(
  '/:addonId',
  requireShopAccess('MANAGER'),
  deleteAddonController
);

export default addonRouter;
