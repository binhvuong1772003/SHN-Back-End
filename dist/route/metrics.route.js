"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const redisMetrics_1 = require("../observability/redisMetrics");
const metricsRouter = (0, express_1.Router)();
const metricsHandler = async (_req, res, next) => {
    try {
        res.setHeader("Content-Type", redisMetrics_1.metricsContentType);
        res.setHeader("Cache-Control", "no-store");
        return res.end(await (0, redisMetrics_1.getMetricsText)());
    }
    catch (error) {
        return next(error);
    }
};
metricsRouter.get("/metrics", metricsHandler);
metricsRouter.get("/health/metrics", metricsHandler);
exports.default = metricsRouter;
