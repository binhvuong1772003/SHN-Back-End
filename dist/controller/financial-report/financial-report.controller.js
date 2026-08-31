"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialReportController = void 0;
const financial_report_service_1 = require("@/service/financial-report/financial-report.service");
const apiResponse_1 = require("@/utils/apiResponse");
const getFinancialReportController = async (req, res, next) => {
    try {
        const report = await (0, financial_report_service_1.getFinancialReportService)(req.params.shopSlug, req.query);
        return (0, apiResponse_1.sendSuccess)(res, report);
    }
    catch (error) {
        next(error);
    }
};
exports.getFinancialReportController = getFinancialReportController;
