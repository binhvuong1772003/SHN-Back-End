"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// route/service/serviceOption.route.ts
const express_1 = require("express");
const shop_middleware_1 = require("@/middleware/shop.middleware");
const serviceOption_controller_1 = require("@/controller/service/serviceOption.controller");
const serviceOptionRouter = (0, express_1.Router)({ mergeParams: true });
serviceOptionRouter.get('/', (0, shop_middleware_1.requireShopAccess)(), serviceOption_controller_1.getServiceOptionsController);
serviceOptionRouter.get('/:optionId', (0, shop_middleware_1.requireShopAccess)(), serviceOption_controller_1.getServiceOptionByIdController);
serviceOptionRouter.post('/', (0, shop_middleware_1.requireShopAccess)('MANAGER'), serviceOption_controller_1.createServiceOptionController);
serviceOptionRouter.patch('/:optionId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), serviceOption_controller_1.updateServiceOptionCtrl);
serviceOptionRouter.delete('/:optionId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), serviceOption_controller_1.deleteServiceOptionController);
exports.default = serviceOptionRouter;
