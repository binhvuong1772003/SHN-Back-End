"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddonController = exports.updateAddonController = exports.getAddonByIdController = exports.getAddonsController = exports.createAddonController = void 0;
const addon_service_1 = require("../../service/service/addon.service");
const apiResponse_1 = require("../../utils/apiResponse");
const createAddonController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, addon_service_1.createAddonService)(shopSlug, req.body);
        (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (err) {
        next(err);
    }
};
exports.createAddonController = createAddonController;
const getAddonsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, addon_service_1.getAddonServices)(shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getAddonsController = getAddonsController;
const getAddonByIdController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const addonId = req.params.addonId;
        const result = await (0, addon_service_1.getAddonServiceById)(shopSlug, addonId);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getAddonByIdController = getAddonByIdController;
const updateAddonController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const addonId = req.params.addonId;
        const result = await (0, addon_service_1.updateAddonService)(shopSlug, addonId, req.body);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.updateAddonController = updateAddonController;
const deleteAddonController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const addonId = req.params.addonId;
        await (0, addon_service_1.deleteAddonService)(shopSlug, addonId);
        (0, apiResponse_1.sendSuccess)(res, null, { message: 'Addon deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteAddonController = deleteAddonController;
