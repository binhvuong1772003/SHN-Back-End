"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopCustomerController = void 0;
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
