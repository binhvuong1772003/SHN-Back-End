"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsContentType = exports.getMetricsText = exports.finishHttpRequest = exports.startHttpRequest = exports.recordRedisCacheError = exports.recordRedisCacheMiss = exports.recordRedisCacheHit = exports.httpRequestsInFlight = exports.httpRequestDurationSeconds = exports.httpErrorsTotal = exports.httpRequestsTotal = exports.metricsRegistry = void 0;
const prom_client_1 = require("prom-client");
/** Dedicated registry for application and process metrics exposed by /metrics. */
exports.metricsRegistry = new prom_client_1.Registry();
// Include standard Node.js metrics (CPU, memory, event loop, GC, etc.).
(0, prom_client_1.collectDefaultMetrics)({ register: exports.metricsRegistry });
const redisCacheCounters = {
    hits: new prom_client_1.Counter({
        name: "redis_cache_hits_total",
        help: "Number of Redis cache hits.",
        labelNames: ["cache"],
        registers: [exports.metricsRegistry],
    }),
    misses: new prom_client_1.Counter({
        name: "redis_cache_misses_total",
        help: "Number of Redis cache misses.",
        labelNames: ["cache"],
        registers: [exports.metricsRegistry],
    }),
    errors: new prom_client_1.Counter({
        name: "redis_cache_errors_total",
        help: "Number of Redis cache errors.",
        labelNames: ["cache"],
        registers: [exports.metricsRegistry],
    }),
};
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests.",
    labelNames: ["method", "route", "status_code"],
    registers: [exports.metricsRegistry],
});
exports.httpErrorsTotal = new prom_client_1.Counter({
    name: "http_errors_total",
    help: "Total number of HTTP responses with a server error status.",
    labelNames: ["method", "route", "status_code"],
    registers: [exports.metricsRegistry],
});
exports.httpRequestDurationSeconds = new prom_client_1.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds.",
    labelNames: ["method", "route", "status_code"],
    registers: [exports.metricsRegistry],
});
exports.httpRequestsInFlight = new prom_client_1.Gauge({
    name: "http_requests_in_flight",
    help: "Number of HTTP requests currently being processed.",
    registers: [exports.metricsRegistry],
});
const cacheNames = [
    "staff_schedule",
    "staff_list",
    "service_list",
    "other",
];
// Emit zero-valued series from startup so dashboards have a stable label set.
for (const counter of Object.values(redisCacheCounters)) {
    for (const cache of cacheNames)
        counter.inc({ cache }, 0);
}
const cacheNameFromKey = (key) => {
    if (key.includes(":staff:") && key.endsWith(":schedule")) {
        return "staff_schedule";
    }
    if (key.includes(":staff:list:"))
        return "staff_list";
    if (key.includes(":service:list:"))
        return "service_list";
    return "other";
};
const increment = (metric, key) => {
    redisCacheCounters[metric].inc({ cache: cacheNameFromKey(key) });
};
const recordRedisCacheHit = (key) => increment("hits", key);
exports.recordRedisCacheHit = recordRedisCacheHit;
const recordRedisCacheMiss = (key) => increment("misses", key);
exports.recordRedisCacheMiss = recordRedisCacheMiss;
const recordRedisCacheError = (key) => increment("errors", key);
exports.recordRedisCacheError = recordRedisCacheError;
const httpLabels = (req, res) => ({
    method: req.method,
    route: req.route?.path?.toString() || "unmatched",
    status_code: String(res.statusCode),
});
const startHttpRequest = () => exports.httpRequestsInFlight.inc();
exports.startHttpRequest = startHttpRequest;
const finishHttpRequest = (req, res, durationSeconds) => {
    const labels = httpLabels(req, res);
    exports.httpRequestsInFlight.dec();
    exports.httpRequestsTotal.inc(labels);
    exports.httpRequestDurationSeconds.observe(labels, durationSeconds);
    if (res.statusCode >= 500) {
        exports.httpErrorsTotal.inc(labels);
    }
};
exports.finishHttpRequest = finishHttpRequest;
const getMetricsText = () => exports.metricsRegistry.metrics();
exports.getMetricsText = getMetricsText;
exports.metricsContentType = exports.metricsRegistry.contentType;
