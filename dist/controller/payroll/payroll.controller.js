"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPayrollDetailController = exports.getMyPayrollsController = exports.payPayrollController = exports.confirmPayrollController = exports.adjustDraftPayrollController = exports.getPayrollDetailController = exports.getPayrollListController = exports.generateDraftPayrollsController = exports.upsertServiceCommissionController = exports.getServiceCommissionsController = exports.upsertSalaryConfigController = exports.getSalaryConfigController = void 0;
const payroll_service_1 = require("../../service/payroll/payroll.service");
const apiResponse_1 = require("../../utils/apiResponse");
const getSalaryConfigController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.getSalaryConfigService)(req.params.shopSlug, req.params.staffId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getSalaryConfigController = getSalaryConfigController;
const upsertSalaryConfigController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.upsertSalaryConfigService)(req.params.shopSlug, req.params.staffId, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.upsertSalaryConfigController = upsertSalaryConfigController;
const getServiceCommissionsController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.getServiceCommissionsService)(req.params.shopSlug, req.params.staffId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceCommissionsController = getServiceCommissionsController;
const upsertServiceCommissionController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.upsertServiceCommissionService)(req.params.shopSlug, req.params.staffId, req.params.serviceId, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.upsertServiceCommissionController = upsertServiceCommissionController;
const generateDraftPayrollsController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.generateDraftPayrollsService)(req.params.shopSlug, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, result, { statusCode: 201 });
    }
    catch (error) {
        next(error);
    }
};
exports.generateDraftPayrollsController = generateDraftPayrollsController;
const getPayrollListController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.getPayrollListService)(req.params.shopSlug, req.query);
        return (0, apiResponse_1.sendSuccess)(res, result.items, { meta: result.meta });
    }
    catch (error) {
        next(error);
    }
};
exports.getPayrollListController = getPayrollListController;
const getPayrollDetailController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.getPayrollDetailService)(req.params.shopSlug, req.params.payrollId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getPayrollDetailController = getPayrollDetailController;
const adjustDraftPayrollController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.adjustDraftPayrollService)(req.params.shopSlug, req.params.payrollId, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.adjustDraftPayrollController = adjustDraftPayrollController;
const confirmPayrollController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.confirmPayrollService)(req.params.shopSlug, req.params.payrollId, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.confirmPayrollController = confirmPayrollController;
const payPayrollController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.payPayrollService)(req.params.shopSlug, req.params.payrollId, req.body, req.user.userId, req.ip);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.payPayrollController = payPayrollController;
const getMyPayrollsController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.getMyPayrollsService)(req.params.shopSlug, req.user.userId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPayrollsController = getMyPayrollsController;
const getMyPayrollDetailController = async (req, res, next) => {
    try {
        const result = await (0, payroll_service_1.getMyPayrollDetailService)(req.params.shopSlug, req.user.userId, req.params.payrollId);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPayrollDetailController = getMyPayrollDetailController;
