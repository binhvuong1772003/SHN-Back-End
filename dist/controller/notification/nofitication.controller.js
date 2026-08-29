"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationController = exports.markReadController = exports.getListNotificationController = void 0;
const notification_service_1 = require("@/service/notification/notification.service");
const getListNotificationController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        console.log('shopSlug:', shopSlug); // ← log xem có giá trị không
        const result = await (0, notification_service_1.getListNotification)(shopSlug);
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
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
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotificationController = deleteNotificationController;
