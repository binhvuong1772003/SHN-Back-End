"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncomeByDayWeeklyController = exports.markAllAppointmentsAsDoneController = exports.changeAppointmentStatusController = exports.getAppointmentsByDayController = exports.getAppointmentsByShopIdController = exports.createAppointmentController = void 0;
const appointment_service_1 = require("@/service/appointment/appointment.service");
const createAppointmentController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const customerId = req.user?.userId;
        const input = req.body;
        const appointment = await (0, appointment_service_1.createAppointment)(input, customerId, shopSlug);
        res.status(201).json({
            success: true,
            data: appointment,
            message: "Đặt lịch thành công",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createAppointmentController = createAppointmentController;
const getAppointmentsByShopIdController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const appointments = await (0, appointment_service_1.getAppointmentsByShopId)(shopSlug);
        res.status(200).json({
            success: true,
            data: appointments,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAppointmentsByShopIdController = getAppointmentsByShopIdController;
const getAppointmentsByDayController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const dateStr = req.query.date;
        const appointments = await (0, appointment_service_1.getAppointmentsByDay)(shopSlug, dateStr);
        res.status(200).json({
            success: true,
            data: appointments,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAppointmentsByDayController = getAppointmentsByDayController;
const changeAppointmentStatusController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const appointmentId = req.params.appointmentId;
        const status = req.body.status;
        const appointment = await (0, appointment_service_1.changeAppointmentStatus)(shopSlug, appointmentId, status);
        res.status(200).json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changeAppointmentStatusController = changeAppointmentStatusController;
const markAllAppointmentsAsDoneController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const result = await (0, appointment_service_1.markAllAppointmentsAsDone)(shopSlug);
        res.status(200).json({
            success: true,
            data: result,
            message: "Đã cập nhật tất cả lịch hẹn thành DONE",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllAppointmentsAsDoneController = markAllAppointmentsAsDoneController;
const getIncomeByDayWeeklyController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const income = await (0, appointment_service_1.getIncomeByDayWeekly)(shopSlug);
        res.status(200).json({
            success: true,
            data: income,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getIncomeByDayWeeklyController = getIncomeByDayWeeklyController;
