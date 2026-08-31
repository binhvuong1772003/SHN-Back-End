import type { NextFunction, Request, Response } from "express";
import {
  finishHttpRequest,
  startHttpRequest,
} from "@/observability/redisMetrics";

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startedAt = process.hrtime.bigint();
  startHttpRequest();

  let recorded = false;
  const record = () => {
    if (recorded) return;
    recorded = true;
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    finishHttpRequest(req, res, durationSeconds);
  };

  // `close` covers aborted client connections where `finish` is not emitted.
  res.once("finish", record);
  res.once("close", record);

  next();
};
