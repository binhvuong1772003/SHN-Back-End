"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffListByShopController = exports.getStaffDetailController = exports.getStaffScheduleController = exports.deleteStaffScheduleController = exports.updateStaffScheduleController = exports.updateStaffInfoController = exports.acceptInviteController = exports.inviteStaffController = void 0;
const ApiError_1 = require("@/utils/ApiError");
const staff_service_1 = require("@/service/staff/staff.service");
const apiResponse_1 = require("@/utils/apiResponse");
const inviteStaffController = async (req, res, next) => {
    try {
        console.log("body:", req.body);
        const { invitedEmail, role } = req.body;
        const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
        if (!isSuperAdmin && req.shopStaff?.role === "MANAGER" && role !== "STAFF") {
            throw new ApiError_1.ApiError(403, "Managers can only add staff members");
        }
        const shopSlug = req.params.shopSlug;
        const invitedBy = req.user.userId;
        const result = await (0, staff_service_1.inviteStaffService)(shopSlug, invitedEmail, role, invitedBy);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.inviteStaffController = inviteStaffController;
const acceptInviteController = async (req, res, next) => {
    try {
        const { token } = req.query;
        const userId = req.user.userId;
        const result = await (0, staff_service_1.acceptInviteService)(token, userId);
        (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.acceptInviteController = acceptInviteController;
const updateStaffInfoController = async (req, res, next) => {
    try {
        const { shopSlug, staffId } = req.params;
        const { role, permissions, isActive } = req.body;
        const canChangeRole = req.user?.role === "SUPER_ADMIN" || req.shopStaff?.role === "OWNER";
        if ((role !== undefined || permissions !== undefined) && !canChangeRole) {
            throw new ApiError_1.ApiError(403, "Only the shop owner can change staff roles or permissions");
        }
        const updatedStaff = await (0, staff_service_1.updateStaffInfoService)(shopSlug, staffId, {
            role,
            permissions,
            isActive,
        });
        return (0, apiResponse_1.sendSuccess)(res, updatedStaff);
    }
    catch (error) {
        next(error);
    }
};
exports.updateStaffInfoController = updateStaffInfoController;
const updateStaffScheduleController = async (req, res, next) => {
    try {
        const { shopSlug, staffId } = req.params;
        const schedule = req.body;
        const updatedSchedule = await (0, staff_service_1.updateStaffScheduleService)(shopSlug, staffId, schedule);
        return (0, apiResponse_1.sendSuccess)(res, updatedSchedule);
    }
    catch (error) {
        next(error);
    }
};
exports.updateStaffScheduleController = updateStaffScheduleController;
const deleteStaffScheduleController = async (req, res, next) => {
    try {
        const { shopSlug, staffId } = req.params;
        const result = await (0, staff_service_1.deleteStaffScheduleService)(shopSlug, staffId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStaffScheduleController = deleteStaffScheduleController;
const getStaffScheduleController = async (req, res, next) => {
    try {
        const { shopSlug, staffId } = req.params;
        const schedule = await (0, staff_service_1.getStaffScheduleService)(shopSlug, staffId);
        return (0, apiResponse_1.sendSuccess)(res, schedule);
    }
    catch (error) {
        next(error);
    }
};
exports.getStaffScheduleController = getStaffScheduleController;
const getStaffDetailController = async (req, res, next) => {
    try {
        const result = await (0, staff_service_1.getStaffDetailService)(req.params.shopSlug, req.params.staffId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getStaffDetailController = getStaffDetailController;
const getStaffListByShopController = async (req, res, next) => {
    try {
        const { shopSlug } = req.params;
        const rawPage = Number(req.query.page ?? 1);
        const rawLimit = Number(req.query.limit ?? 5);
        const role = req.query.role;
        const status = req.query.status;
        const sort = req.query.sort;
        const result = await (0, staff_service_1.getStaffListByShopService)(shopSlug, {
            page: Number.isFinite(rawPage) ? rawPage : 1,
            limit: Number.isFinite(rawLimit) ? rawLimit : 5,
            search: typeof req.query.search === "string" ? req.query.search : undefined,
            role,
            status,
            sort,
        });
        return (0, apiResponse_1.sendSuccess)(res, result.items, { meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages, hasNext: result.page < result.totalPages, hasPrev: result.page > 1 } });
    }
    catch (error) {
        next(error);
    }
};
exports.getStaffListByShopController = getStaffListByShopController;
