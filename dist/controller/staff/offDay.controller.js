"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailDayOffController = exports.getListOffDayController = exports.responseOffDayController = exports.requestOffDayController = void 0;
const offDay_service_1 = require("@/service/staff/offDay.service");
const requestOffDayController = async (req, res, next) => {
    try {
        const { shopSlug, staffId } = req.params;
        const data = req.body;
        const result = await (0, offDay_service_1.requestOffDayService)(shopSlug, staffId, data);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.requestOffDayController = requestOffDayController;
const responseOffDayController = async (req, res, next) => {
    try {
        const { offDayId } = req.params;
        const data = req.body;
        const result = await (0, offDay_service_1.responseOffDayService)(offDayId, data);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.responseOffDayController = responseOffDayController;
const getListOffDayController = async (req, res, next) => {
    try {
        const { shopSlug } = req.params;
        const result = await (0, offDay_service_1.getListOffDayService)(shopSlug);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.getListOffDayController = getListOffDayController;
const getDetailDayOffController = async (req, res, next) => {
    try {
        const { offDayId } = req.params;
        const result = await (0, offDay_service_1.getDetailOffDayService)(offDayId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.getDetailDayOffController = getDetailDayOffController;
