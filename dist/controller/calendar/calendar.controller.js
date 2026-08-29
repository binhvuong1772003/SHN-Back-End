"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthAvailabilityController = exports.getAppointmentsWithSlotsController = exports.getTimeSlotsController = exports.getAllSlotsController = exports.getAvailableSlotsController = void 0;
const calendar_service_1 = require("@/service/calendar/calendar.service");
const getAvailableSlotsController = async (req, res, next) => {
    try {
        const shopSlug = req.params.shopSlug;
        const { date, durationMin, staffId } = req.query;
        if (!date ||
            !durationMin ||
            typeof date !== "string" ||
            typeof durationMin !== "string") {
            return res.status(400).json({
                success: false,
                message: "date và durationMin là bắt buộc và phải là string",
            });
        }
        const slots = await (0, calendar_service_1.getAvailableSlots)({
            shopSlug,
            date,
            durationMin: parseInt(durationMin),
            staffId: staffId || undefined,
        });
        res.status(200).json({ success: true, data: slots });
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
        if (!date ||
            !durationMin ||
            typeof date !== "string" ||
            typeof durationMin !== "string") {
            return res.status(400).json({
                success: false,
                message: "date và durationMin là bắt buộc và phải là string",
            });
        }
        const slots = await (0, calendar_service_1.getAllSlots)(shopSlug, date, parseInt(durationMin));
        res.status(200).json({ success: true, data: slots });
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
        if (!date || typeof date !== "string") {
            return res.status(400).json({
                success: false,
                message: "date là bắt buộc và phải là string",
            });
        }
        const slots = await (0, calendar_service_1.getTimeSlots)(shopSlug, date);
        res.status(200).json({ success: true, data: slots });
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
        if (!date || typeof date !== "string") {
            return res.status(400).json({
                success: false,
                message: "date là bắt buộc và phải là string",
            });
        }
        const data = await (0, calendar_service_1.getAppointmentsWithSlots)(shopSlug, date);
        res.status(200).json({ success: true, data });
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
        if (!year ||
            !month ||
            typeof year !== "string" ||
            typeof month !== "string") {
            return res.status(400).json({
                success: false,
                message: "year và month là bắt buộc và phải là string",
            });
        }
        const availability = await (0, calendar_service_1.getMonthAvailability)(shopSlug, parseInt(year), parseInt(month), typeof staffId === "string" ? staffId : undefined);
        res.status(200).json({ success: true, data: availability });
    }
    catch (error) {
        next(error);
    }
};
exports.getMonthAvailabilityController = getMonthAvailabilityController;
