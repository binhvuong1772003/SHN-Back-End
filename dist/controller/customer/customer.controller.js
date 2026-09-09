"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerDetailController = exports.getCustomerListController = exports.getTopCustomerController = void 0;
const customer_service_1 = require("../../service/customer/customer.service");
const apiResponse_1 = require("../../utils/apiResponse");
const getTopCustomerController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const limit = Number(req.query.limit ?? 5);
        const customers = await (0, customer_service_1.getTopCustomer)(shopSlug, limit);
        (0, apiResponse_1.sendSuccess)(res, customers);
    }
    catch (error) {
        next(error);
    }
};
exports.getTopCustomerController = getTopCustomerController;
const getCustomerListController = async (req, res, next) => {
    try {
        const result = await (0, customer_service_1.getCustomerList)(req.params.shopSlug, req.query);
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerListController = getCustomerListController;
const getCustomerDetailController = async (req, res, next) => {
    try {
        const result = await (0, customer_service_1.getCustomerDetail)(req.params.shopSlug, req.params.customerId);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerDetailController = getCustomerDetailController;
