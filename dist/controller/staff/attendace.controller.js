"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustAttendanceController = exports.getShopAttendanceController = exports.getMyAttendanceHistoryController = exports.getMyTodayAttendanceController = exports.manualAttendanceController = exports.getCheckOutQRController = exports.getCheckInQRController = exports.qrCheckOutController = exports.qrCheckInController = void 0;
const attendance_service_1 = require("@/service/staff/attendance.service");
const apiResponse_1 = require("@/utils/apiResponse");
const qrCheckInController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.qrCheckInService)(req.body.qrToken, req.params.shopSlug, req.user.userId);
        return (0, apiResponse_1.sendSuccess)(res, attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.qrCheckInController = qrCheckInController;
const qrCheckOutController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.qrCheckOutService)(req.body.qrToken, req.params.shopSlug, req.user.userId);
        return (0, apiResponse_1.sendSuccess)(res, attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.qrCheckOutController = qrCheckOutController;
const getCheckInQRController = async (req, res, next) => {
    try {
        const qr = await (0, attendance_service_1.generateCheckInQRService)(req.params.shopSlug);
        return (0, apiResponse_1.sendSuccess)(res, qr);
    }
    catch (error) {
        next(error);
    }
};
exports.getCheckInQRController = getCheckInQRController;
const getCheckOutQRController = async (req, res, next) => {
    try {
        const qr = await (0, attendance_service_1.generateCheckOutQRService)(req.params.shopSlug);
        return (0, apiResponse_1.sendSuccess)(res, qr);
    }
    catch (error) {
        next(error);
    }
};
exports.getCheckOutQRController = getCheckOutQRController;
const manualAttendanceController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.manualAttendanceService)(req.params.shopSlug, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.manualAttendanceController = manualAttendanceController;
const getMyTodayAttendanceController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.getMyTodayAttendanceService)(req.params.shopSlug, req.user.userId);
        return (0, apiResponse_1.sendSuccess)(res, attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTodayAttendanceController = getMyTodayAttendanceController;
const getMyAttendanceHistoryController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.getMyAttendanceHistoryService)(req.params.shopSlug, req.user.userId, req.query);
        return (0, apiResponse_1.sendSuccess)(res, attendance.items, { meta: attendance.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyAttendanceHistoryController = getMyAttendanceHistoryController;
const getShopAttendanceController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.getShopAttendanceService)(req.params.shopSlug, req.query);
        return (0, apiResponse_1.sendSuccess)(res, attendance.items, { meta: attendance.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getShopAttendanceController = getShopAttendanceController;
const adjustAttendanceController = async (req, res, next) => {
    try {
        const attendance = await (0, attendance_service_1.adjustAttendanceService)(req.params.shopSlug, req.params.attendanceId, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.adjustAttendanceController = adjustAttendanceController;
