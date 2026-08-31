"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countServiceController = exports.updateServiceController = exports.deleteServiceController = exports.getServiceByIdController = exports.getSerivceController = exports.createServiceController = void 0;
const service_service_1 = require("@/service/service/service.service");
const apiResponse_1 = require("@/utils/apiResponse");
const createServiceController = async (req, res, next) => {
    try {
        const data = req.body;
        const shopSlug = req.params.shopSlug;
        const result = await (0, service_service_1.createService)(data, shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (error) {
        next(error);
    }
};
exports.createServiceController = createServiceController;
const getSerivceController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, service_service_1.getService)(shopSlug, {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 5,
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            status: req.query.status === "ACTIVE" || req.query.status === "INACTIVE" ? req.query.status : undefined,
            category: typeof req.query.category === "string" ? req.query.category : undefined,
            sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
        });
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages, hasNext: result.page < result.totalPages, hasPrev: result.page > 1, counts: result.counts } });
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
        (0, apiResponse_1.sendSuccess)(res, result);
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
        (0, apiResponse_1.sendSuccess)(res, result);
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
        (0, apiResponse_1.sendSuccess)(res, result);
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
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.countServiceController = countServiceController;
