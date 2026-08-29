"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServicePackageController = exports.updateServicePackageController = exports.getServicePackageByIdController = exports.getServicePackagesController = exports.createServicePackageController = void 0;
const servicePackage_service_1 = require("@/service/service/servicePackage.service");
const createServicePackageController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, servicePackage_service_1.createServicePackage)(req.body, shopSlug);
        res.status(201).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, message: 'Xóa package thành công' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteServicePackageController = deleteServicePackageController;
