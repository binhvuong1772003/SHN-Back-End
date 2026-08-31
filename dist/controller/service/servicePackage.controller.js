"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServicePackageController = exports.updateServicePackageController = exports.getServicePackageByIdController = exports.getServicePackagesController = exports.createServicePackageController = void 0;
const servicePackage_service_1 = require("../../service/service/servicePackage.service");
const apiResponse_1 = require("../../utils/apiResponse");
const createServicePackageController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, servicePackage_service_1.createServicePackage)(req.body, shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (err) {
        next(err);
    }
};
exports.createServicePackageController = createServicePackageController;
const getServicePackagesController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, servicePackage_service_1.getServicePackages)(shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getServicePackagesController = getServicePackagesController;
const getServicePackageByIdController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const packageId = req.params.packageId;
        const result = await (0, servicePackage_service_1.getServicePackageById)(shopSlug, packageId);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getServicePackageByIdController = getServicePackageByIdController;
const updateServicePackageController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const packageId = req.params.packageId;
        const result = await (0, servicePackage_service_1.updateServicePackage)(shopSlug, packageId, req.body);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.updateServicePackageController = updateServicePackageController;
const deleteServicePackageController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const packageId = req.params.packageId;
        await (0, servicePackage_service_1.deleteServicePackage)(shopSlug, packageId);
        (0, apiResponse_1.sendSuccess)(res, null, { message: 'Package deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteServicePackageController = deleteServicePackageController;
