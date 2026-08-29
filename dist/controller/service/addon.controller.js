"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddonController = exports.updateAddonController = exports.getAddonByIdController = exports.getAddonsController = exports.createAddonController = void 0;
const addon_service_1 = require("@/service/service/addon.service");
const createAddonController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, addon_service_1.createAddonService)(shopSlug, req.body);
        res.status(201).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, message: 'Xóa addon thành công' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteAddonController = deleteAddonController;
