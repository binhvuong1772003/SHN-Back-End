"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceOptionController = exports.updateServiceOptionCtrl = exports.getServiceOptionByIdController = exports.getServiceOptionsController = exports.createServiceOptionController = void 0;
const option_service_1 = require("../../service/service/option.service");
const apiResponse_1 = require("../../utils/apiResponse");
const createServiceOptionController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const result = await (0, option_service_1.createServiceOption)(req.body, shopSlug, serviceId);
        (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (err) {
        next(err);
    }
};
exports.createServiceOptionController = createServiceOptionController;
const getServiceOptionsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        console.log(shopSlug);
        const serviceId = req.params.serviceId;
        const result = await (0, option_service_1.getServiceOptions)(serviceId, shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getServiceOptionsController = getServiceOptionsController;
const getServiceOptionByIdController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const optionId = req.params.optionId;
        const result = await (0, option_service_1.getServiceOptionById)(optionId, shopSlug, serviceId);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getServiceOptionByIdController = getServiceOptionByIdController;
const updateServiceOptionCtrl = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const optionId = req.params.optionId;
        const result = await (0, option_service_1.updateServiceOptionController)(req.body, shopSlug, serviceId, optionId);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.updateServiceOptionCtrl = updateServiceOptionCtrl;
const deleteServiceOptionController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const optionId = req.params.optionId;
        await (0, option_service_1.deleteServiceOption)(shopSlug, serviceId, optionId);
        (0, apiResponse_1.sendSuccess)(res, null, { message: 'Option deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteServiceOptionController = deleteServiceOptionController;
