"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// route/service/addon.route.ts
const express_1 = require("express");
const shop_middleware_1 = require("@/middleware/shop.middleware");
const validation_middleware_1 = require("@/middleware/validation.middleware");
const common_validate_1 = require("@/validation/common.validate");
const service_validate_1 = require("@/validation/service.validate");
const addon_controller_1 = require("@/controller/service/addon.controller");
const addonRouter = (0, express_1.Router)({ mergeParams: true });
addonRouter.get('/', (0, shop_middleware_1.requireShopAccess)(), addon_controller_1.getAddonsController);
addonRouter.get('/:addonId', (0, shop_middleware_1.requireShopAccess)(), (0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('addonId') }), addon_controller_1.getAddonByIdController);
addonRouter.post('/', (0, shop_middleware_1.requireShopAccess)('MANAGER'), (0, validation_middleware_1.validate)({ body: service_validate_1.createAddonSchema }), addon_controller_1.createAddonController);
addonRouter.patch('/:addonId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), (0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('addonId'), body: service_validate_1.updateAddonSchema }), addon_controller_1.updateAddonController);
addonRouter.delete('/:addonId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), (0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('addonId') }), addon_controller_1.deleteAddonController);
exports.default = addonRouter;
