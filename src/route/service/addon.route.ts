// route/service/addon.route.ts
import { Router } from 'express';
import { requireShopAccess } from '@/middleware/shop.middleware';
import { validate } from '@/middleware/validation.middleware';
import { idParamSchema } from '@/validation/common.validate';
import { createAddonSchema, updateAddonSchema } from '@/validation/service.validate';
import {
  createAddonController,
  getAddonsController,
  getAddonByIdController,
  updateAddonController,
  deleteAddonController,
} from '@/controller/service/addon.controller';

const addonRouter = Router({ mergeParams: true });

addonRouter.get('/', requireShopAccess(), getAddonsController);
addonRouter.get('/:addonId', requireShopAccess(), validate({ params: idParamSchema('addonId') }), getAddonByIdController);
addonRouter.post('/', requireShopAccess('MANAGER'), validate({ body: createAddonSchema }), createAddonController);
addonRouter.patch(
  '/:addonId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('addonId'), body: updateAddonSchema }),
  updateAddonController
);
addonRouter.delete(
  '/:addonId',
  requireShopAccess('MANAGER'),
  validate({ params: idParamSchema('addonId') }),
  deleteAddonController
);

export default addonRouter;
