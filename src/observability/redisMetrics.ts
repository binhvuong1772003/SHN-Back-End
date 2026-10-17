import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import type { Request, Response } from "express";

type RedisCacheMetric = "hits" | "misses" | "errors";
type RedisCacheName = "staff_schedule" | "staff_list" | "service_list" | "other";
type HttpLabel = "method" | "route" | "status_code";

/** Dedicated registry for application and process metrics exposed by /metrics. */
export const metricsRegistry = new Registry();

// Include standard Node.js metrics (CPU, memory, event loop, GC, etc.).
collectDefaultMetrics({ register: metricsRegistry });

const redisCacheCounters: Record<RedisCacheMetric, Counter<"cache">> = {
  hits: new Counter<"cache">({
    name: "redis_cache_hits_total",
    help: "Number of Redis cache hits.",
    labelNames: ["cache"],
    registers: [metricsRegistry],
  }),
  misses: new Counter<"cache">({
    name: "redis_cache_misses_total",
    help: "Number of Redis cache misses.",
    labelNames: ["cache"],
    registers: [metricsRegistry],
  }),
  errors: new Counter<"cache">({
    name: "redis_cache_errors_total",
    help: "Number of Redis cache errors.",
    labelNames: ["cache"],
    registers: [metricsRegistry],
  }),
};

export const httpRequestsTotal = new Counter<HttpLabel>({
  name: "http_requests_total",
  help: "Total number of HTTP requests.",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

export const httpErrorsTotal = new Counter<HttpLabel>({
  name: "http_errors_total",
  help: "Total number of HTTP responses with a server error status.",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram<HttpLabel>({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

export const httpRequestsInFlight = new Gauge({
  name: "http_requests_in_flight",
  help: "Number of HTTP requests currently being processed.",
  registers: [metricsRegistry],
});

const cacheNames: RedisCacheName[] = [
  "staff_schedule",
  "staff_list",
  "service_list",
  "other",
];

// Emit zero-valued series from startup so dashboards have a stable label set.
for (const counter of Object.values(redisCacheCounters)) {
  for (const cache of cacheNames) counter.inc({ cache }, 0);
}

const cacheNameFromKey = (key: string): RedisCacheName => {
  if (key.includes(":staff:") && key.endsWith(":schedule")) {
    return "staff_schedule";
  }
  if (key.includes(":staff:list:")) return "staff_list";
  if (key.includes(":service:list:")) return "service_list";
  return "other";
};

const increment = (metric: RedisCacheMetric, key: string) => {
  redisCacheCounters[metric].inc({ cache: cacheNameFromKey(key) });
};

export const recordRedisCacheHit = (key: string) => increment("hits", key);
export const recordRedisCacheMiss = (key: string) => increment("misses", key);
export const recordRedisCacheError = (key: string) => increment("errors", key);

const httpLabels = (req: Request, res: Response) => ({
  method: req.method,
  route: req.route?.path?.toString() || "unmatched",
  status_code: String(res.statusCode),
});

export const startHttpRequest = () => httpRequestsInFlight.inc();

export const finishHttpRequest = (
  req: Request,
  res: Response,
  durationSeconds: number,
) => {
  const labels = httpLabels(req, res);
  httpRequestsInFlight.dec();
  httpRequestsTotal.inc(labels);
  httpRequestDurationSeconds.observe(labels, durationSeconds);
  if (res.statusCode >= 500) {
    httpErrorsTotal.inc(labels);
  }
};

export const getMetricsText = () => metricsRegistry.metrics();
export const metricsContentType = metricsRegistry.contentType;
