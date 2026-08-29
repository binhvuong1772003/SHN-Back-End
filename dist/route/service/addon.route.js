"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// route/service/addon.route.ts
const express_1 = require("express");
const shop_middleware_1 = require("@/middleware/shop.middleware");
const addon_controller_1 = require("@/controller/service/addon.controller");
const addonRouter = (0, express_1.Router)({ mergeParams: true });
addonRouter.get('/', (0, shop_middleware_1.requireShopAccess)(), addon_controller_1.getAddonsController);
addonRouter.get('/:addonId', (0, shop_middleware_1.requireShopAccess)(), addon_controller_1.getAddonByIdController);
addonRouter.post('/', (0, shop_middleware_1.requireShopAccess)('MANAGER'), addon_controller_1.createAddonController);
addonRouter.patch('/:addonId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), addon_controller_1.updateAddonController);
addonRouter.delete('/:addonId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), addon_controller_1.deleteAddonController);
exports.default = addonRouter;
