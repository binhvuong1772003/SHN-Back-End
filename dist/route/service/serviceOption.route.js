"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// route/service/serviceOption.route.ts
const express_1 = require("express");
const shop_middleware_1 = require("@/middleware/shop.middleware");
const validation_middleware_1 = require("@/middleware/validation.middleware");
const common_validate_1 = require("@/validation/common.validate");
const service_validate_1 = require("@/validation/service.validate");
const serviceOption_controller_1 = require("@/controller/service/serviceOption.controller");
const serviceOptionRouter = (0, express_1.Router)({ mergeParams: true });
serviceOptionRouter.use((0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('serviceId') }));
serviceOptionRouter.get('/', (0, shop_middleware_1.requireShopAccess)(), serviceOption_controller_1.getServiceOptionsController);
serviceOptionRouter.get('/:optionId', (0, shop_middleware_1.requireShopAccess)(), (0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('optionId') }), serviceOption_controller_1.getServiceOptionByIdController);
serviceOptionRouter.post('/', (0, shop_middleware_1.requireShopAccess)('MANAGER'), (0, validation_middleware_1.validate)({ body: service_validate_1.createServiceOptionSchema }), serviceOption_controller_1.createServiceOptionController);
serviceOptionRouter.patch('/:optionId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), (0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('optionId'), body: service_validate_1.updateServiceOptionSchema }), serviceOption_controller_1.updateServiceOptionCtrl);
serviceOptionRouter.delete('/:optionId', (0, shop_middleware_1.requireShopAccess)('MANAGER'), (0, validation_middleware_1.validate)({ params: (0, common_validate_1.idParamSchema)('optionId') }), serviceOption_controller_1.deleteServiceOptionController);
exports.default = serviceOptionRouter;
