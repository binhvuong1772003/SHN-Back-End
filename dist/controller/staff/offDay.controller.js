"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailDayOffController = exports.getListOffDayController = exports.responseOffDayController = exports.requestOffDayController = void 0;
const offDay_service_1 = require("@/service/staff/offDay.service");
const ApiError_1 = require("@/utils/ApiError");
const apiResponse_1 = require("@/utils/apiResponse");
const requestOffDayController = async (req, res, next) => {
    try {
        const { shopSlug, staffId } = req.params;
        const data = req.body;
        const result = await (0, offDay_service_1.requestOffDayService)(shopSlug, staffId, req.user.userId, data);
        (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (error) {
        next(error);
    }
};
exports.requestOffDayController = requestOffDayController;
const responseOffDayController = async (req, res, next) => {
    try {
        const { shopSlug, offDayId } = req.params;
        const data = req.body;
        const result = await (0, offDay_service_1.responseOffDayService)(shopSlug, offDayId, req.user.userId, data);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.responseOffDayController = responseOffDayController;
const getListOffDayController = async (req, res, next) => {
    try {
        const { shopSlug } = req.params;
        const assignedToMe = req.query.assignedToMe === true
            || req.query.assignedToMe === 'true';
        if (!assignedToMe && req.shopStaff?.role === 'STAFF') {
            throw new ApiError_1.ApiError(403, 'You cannot view another staff member\'s leave requests');
        }
        const rawPage = Number(req.query.page ?? 1);
        const rawLimit = Number(req.query.limit ?? 10);
        const rawStatus = typeof req.query.status === 'string'
            ? req.query.status.toUpperCase()
            : undefined;
        const status = rawStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(rawStatus)
            ? rawStatus
            : undefined;
        const result = await (0, offDay_service_1.getListOffDayService)(shopSlug, assignedToMe ? req.user.userId : undefined, {
            page: Number.isFinite(rawPage) ? rawPage : 1,
            limit: Number.isFinite(rawLimit) ? rawLimit : 10,
            status,
            staffId: typeof req.query.staffId === 'string' ? req.query.staffId : undefined,
        });
        (0, apiResponse_1.sendSuccess)(res, result.items, { meta: { ...result.meta, hasNext: result.meta.page < result.meta.totalPages, hasPrev: result.meta.page > 1 } });
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
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getDetailDayOffController = getDetailDayOffController;
