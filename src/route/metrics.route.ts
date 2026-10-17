import { NextFunction, Request, Response, Router } from "express";
import {
  getMetricsText,
  metricsContentType,
} from "@/observability/redisMetrics";

const metricsRouter = Router();

const metricsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.setHeader("Content-Type", metricsContentType);
    res.setHeader("Cache-Control", "no-store");
    return res.end(await getMetricsText());
  } catch (error) {
    return next(error);
  }
};

metricsRouter.get("/metrics", metricsHandler);
metricsRouter.get("/health/metrics", metricsHandler);

export default metricsRouter;
