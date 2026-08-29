"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countServiceController = exports.updateServiceController = exports.deleteServiceController = exports.getServiceByIdController = exports.getSerivceController = exports.createServiceController = void 0;
const service_service_1 = require("@/service/service/service.service");
const createServiceController = async (req, res, next) => {
    try {
        const data = req.body;
        const shopSlug = req.params.shopSlug;
        const result = await (0, service_service_1.createService)(data, shopSlug);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.createServiceController = createServiceController;
const getSerivceController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, service_service_1.getService)(shopSlug);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.getSerivceController = getSerivceController;
const getServiceByIdController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const result = await (0, service_service_1.getServiceById)(shopSlug, serviceId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceByIdController = getServiceByIdController;
const deleteServiceController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const result = await (0, service_service_1.deleteService)(shopSlug, serviceId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteServiceController = deleteServiceController;
const updateServiceController = async (req, res, next) => {
    try {
        console.log("🔄 Update service request:", {
            shopSlug: req.params.shopSlug,
            serviceId: req.params.serviceId,
            body: req.body,
        });
        const shopSlug = req.params.shopSlug;
        const serviceId = req.params.serviceId;
        const data = req.body;
        const result = await (0, service_service_1.updateService)(shopSlug, serviceId, data);
        console.log("✅ Update service success");
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error("❌ Update service error:", error);
        next(error);
    }
};
exports.updateServiceController = updateServiceController;
const countServiceController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, service_service_1.countService)(shopSlug);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.countServiceController = countServiceController;
