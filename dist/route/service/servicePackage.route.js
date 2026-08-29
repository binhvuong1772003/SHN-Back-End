"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// route/service/servicePackage.route.ts
const express_1 = require("express");
const shop_middleware_1 = require("@/middleware/shop.middleware");
const servicePackage_controller_1 = require("@/controller/service/servicePackage.controller");
const servicePackageRouter = (0, express_1.Router)({ mergeParams: true });
servicePackageRouter.get('/', (0, shop_middleware_1.requireShopAccess)(), servicePackage_controller_1.getServicePackagesController);
servicePackageRouter.get('/:packageId', (0, shop_middleware_1.requireShopAccess)(), servicePackage_controller_1.getServicePackageByIdController);
servicePackageRouter.post('/', (0, shop_middleware_1.requireShopAccess)('MANAGER'), servicePackage_controller_1.createServicePackageController);
servicePackageRouter.patch('/:packageId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), servicePackage_controller_1.updateServicePackageController);
servicePackageRouter.delete('/:packageId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), servicePackage_controller_1.deleteServicePackageController);
exports.default = servicePackageRouter;
