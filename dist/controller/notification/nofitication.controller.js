"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationController = exports.markReadController = exports.getListNotificationController = void 0;
const notification_service_1 = require("@/service/notification/notification.service");
const apiResponse_1 = require("@/utils/apiResponse");
const getListNotificationController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        console.log('shopSlug:', shopSlug);
        const result = await (0, notification_service_1.getListNotification)(shopSlug, req.query);
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getListNotificationController = getListNotificationController;
const markReadController = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await (0, notification_service_1.markRead)(id);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.markReadController = markReadController;
const deleteNotificationController = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await (0, notification_service_1.deleteNotification)(id);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotificationController = deleteNotificationController;
