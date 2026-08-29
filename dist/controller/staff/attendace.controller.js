"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCheckOutQRController = exports.getCheckInQRController = exports.qrCheckOutController = exports.qrCheckInController = exports.checkInController = void 0;
const attendance_service_1 = require("@/service/staff/attendance.service");
const checkInController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const shopSlug = req.params.shopSlug;
        const attendance = await (0, attendance_service_1.checkInService)(userId, shopSlug);
        res.status(200).json({ success: true, data: attendance });
    }
    catch (error) {
        next(error);
    }
};
exports.checkInController = checkInController;
const qrCheckInController = async (req, res, next) => {
    try {
        const token = req.query.token;
        const shopSlug = req.params.shopSlug;
        const userId = req.user?.userId;
        const attendance = await (0, attendance_service_1.qrCheckInService)(token, shopSlug, userId);
        res.status(200).json({ success: true, data: attendance });
    }
    catch (error) {
        next(error);
    }
};
exports.qrCheckInController = qrCheckInController;
const qrCheckOutController = async (req, res, next) => {
    try {
        const token = req.query.token;
        const shopSlug = req.params.shopSlug;
        const userId = req.user?.userId;
        const attendance = await (0, attendance_service_1.qrCheckOutService)(token, shopSlug, userId);
        res.status(200).json({ success: true, data: attendance });
    }
    catch (error) {
        next(error);
    }
};
exports.qrCheckOutController = qrCheckOutController;
const getCheckInQRController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const qr = await (0, attendance_service_1.generateCheckInQRService)(shopSlug);
        res.status(200).json({ success: true, data: qr });
    }
    catch (error) {
        next(error);
    }
};
exports.getCheckInQRController = getCheckInQRController;
const getCheckOutQRController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const qr = await (0, attendance_service_1.generateCheckOutQRService)(shopSlug);
        res.status(200).json({ success: true, data: qr });
    }
    catch (error) {
        next(error);
    }
};
exports.getCheckOutQRController = getCheckOutQRController;
