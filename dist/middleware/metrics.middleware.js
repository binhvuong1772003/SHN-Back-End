"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = void 0;
const redisMetrics_1 = require("@/observability/redisMetrics");
const metricsMiddleware = (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    (0, redisMetrics_1.startHttpRequest)();
    let recorded = false;
    const record = () => {
        if (recorded)
            return;
        recorded = true;
        const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
        (0, redisMetrics_1.finishHttpRequest)(req, res, durationSeconds);
    };
    // `close` covers aborted client connections where `finish` is not emitted.
    res.once("finish", record);
    res.once("close", record);
    next();
};
exports.metricsMiddleware = metricsMiddleware;
