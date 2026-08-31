"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncomeByDayWeeklyController = exports.markAllAppointmentsAsDoneController = exports.changeAppointmentStatusController = exports.getAppointmentsByDayController = exports.getAppointmentsByShopIdController = exports.createAppointmentController = void 0;
const appointment_service_1 = require("@/service/appointment/appointment.service");
const apiResponse_1 = require("@/utils/apiResponse");
const createAppointmentController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const customerId = req.user?.userId;
        const input = req.body;
        const appointment = await (0, appointment_service_1.createAppointment)(input, customerId, shopSlug);
        (0, apiResponse_1.sendSuccess)(res, appointment, { statusCode: 201, message: "Appointment created successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.createAppointmentController = createAppointmentController;
const getAppointmentsByShopIdController = async (req, res, next) => {
    try {
        const appointments = await (0, appointment_service_1.getAppointmentsByShopId)(req.params.shopSlug);
        (0, apiResponse_1.sendSuccess)(res, appointments);
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
        const appointments = await (0, appointment_service_1.getAppointmentsByDay)(shopSlug, dateStr, req.query.assignedToMe === "true" ? req.user?.userId : undefined);
        (0, apiResponse_1.sendSuccess)(res, appointments);
    }
    catch (error) {
        next(error);
    }
};
exports.getAppointmentsByDayController = getAppointmentsByDayController;
const changeAppointmentStatusController = async (req, res, next) => {
    try {
        const appointment = await (0, appointment_service_1.changeAppointmentStatus)(req.params.shopSlug, req.params.appointmentId, req.body.status);
        (0, apiResponse_1.sendSuccess)(res, appointment);
    }
    catch (error) {
        next(error);
    }
};
exports.changeAppointmentStatusController = changeAppointmentStatusController;
const markAllAppointmentsAsDoneController = async (req, res, next) => {
    try {
        const result = await (0, appointment_service_1.markAllAppointmentsAsDone)(req.params.shopSlug);
        (0, apiResponse_1.sendSuccess)(res, result, { message: "All appointments marked as done" });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllAppointmentsAsDoneController = markAllAppointmentsAsDoneController;
const getIncomeByDayWeeklyController = async (req, res, next) => {
    try {
        const income = await (0, appointment_service_1.getIncomeByDayWeekly)(req.params.shopSlug);
        (0, apiResponse_1.sendSuccess)(res, income);
    }
    catch (error) {
        next(error);
    }
};
exports.getIncomeByDayWeeklyController = getIncomeByDayWeeklyController;
