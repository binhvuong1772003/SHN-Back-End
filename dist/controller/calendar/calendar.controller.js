"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthAvailabilityController = exports.getAppointmentsWithSlotsController = exports.getTimeSlotsController = exports.getAllSlotsController = exports.getAvailableSlotsController = void 0;
const calendar_service_1 = require("@/service/calendar/calendar.service");
const apiResponse_1 = require("@/utils/apiResponse");
const getAvailableSlotsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const { date, durationMin, staffId } = req.query;
        const slots = await (0, calendar_service_1.getAvailableSlots)({ shopSlug, date, durationMin, staffId });
        (0, apiResponse_1.sendSuccess)(res, slots);
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailableSlotsController = getAvailableSlotsController;
const getAllSlotsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const { date, durationMin } = req.query;
        const slots = await (0, calendar_service_1.getAllSlots)(shopSlug, date, durationMin);
        (0, apiResponse_1.sendSuccess)(res, slots);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllSlotsController = getAllSlotsController;
const getTimeSlotsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const { date } = req.query;
        const slots = await (0, calendar_service_1.getTimeSlots)(shopSlug, date);
        (0, apiResponse_1.sendSuccess)(res, slots);
    }
    catch (error) {
        next(error);
    }
};
exports.getTimeSlotsController = getTimeSlotsController;
const getAppointmentsWithSlotsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const { date } = req.query;
        const data = await (0, calendar_service_1.getAppointmentsWithSlots)(shopSlug, date);
        (0, apiResponse_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
};
exports.getAppointmentsWithSlotsController = getAppointmentsWithSlotsController;
const getMonthAvailabilityController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const { year, month, staffId } = req.query;
        const availability = await (0, calendar_service_1.getMonthAvailability)(shopSlug, year, month, staffId);
        (0, apiResponse_1.sendSuccess)(res, availability);
    }
    catch (error) {
        next(error);
    }
};
exports.getMonthAvailabilityController = getMonthAvailabilityController;
