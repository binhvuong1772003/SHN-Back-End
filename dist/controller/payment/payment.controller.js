"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaymentController = exports.getPaymentController = exports.createPaymentController = exports.getPaymentDetailController = exports.getPaymentListController = void 0;
const payment_service_1 = require("../../service/payment/payment.service");
const apiResponse_1 = require("../../utils/apiResponse");
const getPaymentListController = async (req, res, next) => {
    try {
        const result = await (0, payment_service_1.getPaymentList)(req.params.shopSlug, req.query);
        return (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentListController = getPaymentListController;
const getPaymentDetailController = async (req, res, next) => {
    try {
        const payment = await (0, payment_service_1.getPaymentDetail)(req.params.shopSlug, req.params.paymentId);
        return (0, apiResponse_1.sendSuccess)(res, payment);
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentDetailController = getPaymentDetailController;
const createPaymentController = async (req, res, next) => {
    try {
        const result = await (0, payment_service_1.createPayment)(req.params.shopSlug, req.params.appointmentId, req.user?.userId, req.body);
        (0, apiResponse_1.sendSuccess)(res, result.payment, {
            statusCode: result.created ? 201 : 200,
            message: result.created ? "Payment created successfully" : "Payment already exists",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPaymentController = createPaymentController;
const getPaymentController = async (req, res, next) => {
    try {
        const payment = await (0, payment_service_1.getPayment)(req.params.shopSlug, req.params.appointmentId);
        (0, apiResponse_1.sendSuccess)(res, payment);
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentController = getPaymentController;
const confirmPaymentController = async (req, res, next) => {
    try {
        const payment = await (0, payment_service_1.confirmPayment)(req.params.shopSlug, req.params.appointmentId, req.user?.userId, req.shopStaff?.role, req.body);
        (0, apiResponse_1.sendSuccess)(res, payment, { message: "Payment confirmed successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.confirmPaymentController = confirmPaymentController;
