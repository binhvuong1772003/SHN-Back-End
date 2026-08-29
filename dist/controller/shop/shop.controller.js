"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessHoursController = exports.getBusinessHoursController = exports.uploadShopBannerController = exports.uploadShopLogoController = exports.updateShopController = exports.getShopDetailController = exports.getListShopController = exports.createShopController = void 0;
const shop_service_1 = require("@/service/shop/shop.service");
const cloudinary_1 = require("@/utils/cloudinary");
const createShopController = async (req, res, next) => {
    try {
        const input = req.body;
        const ownerId = req.user?.userId;
        const shop = await (0, shop_service_1.createShopService)(input, ownerId);
        res.status(201).json({ success: true, data: shop });
    }
    catch (error) {
        next(error);
    }
};
exports.createShopController = createShopController;
const getListShopController = async (req, res, next) => {
    try {
        const ownerId = req.user?.userId;
        const shops = await (0, shop_service_1.getListShopService)(ownerId);
        res.status(200).json({ success: true, data: shops });
    }
    catch (error) {
        next(error);
    }
};
exports.getListShopController = getListShopController;
const getShopDetailController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        res.status(200).json({ success: true, data: req.shop });
    }
    catch (error) {
        next(error);
    }
};
exports.getShopDetailController = getShopDetailController;
const updateShopController = async (req, res, next) => {
    try {
        console.log(req.body);
        const shop = await (0, shop_service_1.updateShopService)(req.params.shopSlug, req.body);
        res.status(200).json({ success: true, data: shop });
    }
    catch (error) {
        next(error);
    }
};
exports.updateShopController = updateShopController;
const uploadShopLogoController = async (req, res, next) => {
    try {
        const shop = await (0, shop_service_1.uploadShopLogoService)(req.file, cloudinary_1.CLOUDINARY_FOLDERS.SHOP_LOGO, req.params.shopSlug);
        res.status(200).json({ success: true, data: shop });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadShopLogoController = uploadShopLogoController;
const uploadShopBannerController = async (req, res, next) => {
    try {
        const shop = await (0, shop_service_1.uploadShopBannerService)(req.file, cloudinary_1.CLOUDINARY_FOLDERS.SHOP_COVER, req.params.shopSlug);
        res.status(200).json({ success: true, data: shop });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadShopBannerController = uploadShopBannerController;
const getBusinessHoursController = async (req, res, next) => {
    try {
        const businessHours = await (0, shop_service_1.getBusinessHoursService)(req.params.shopSlug);
        res.status(200).json({ success: true, data: businessHours });
    }
    catch (error) {
        next(error);
    }
};
exports.getBusinessHoursController = getBusinessHoursController;
const updateBusinessHoursController = async (req, res, next) => {
    try {
        const businessHours = await (0, shop_service_1.updateBusinessHoursService)(req.params.shopSlug, req.body);
        res.status(200).json({ success: true, data: businessHours });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBusinessHoursController = updateBusinessHoursController;
