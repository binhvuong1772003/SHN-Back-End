import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "@/utils/ApiError";
import { sendError } from "@/utils/apiResponse";

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, {
    code: "ROUTE_NOT_FOUND",
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = req.headers["x-request-id"] as string | undefined;

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    return sendError(res, error.statusCode, error.message, {
      code: error.code,
      details: error.errors ?? null,
      requestId,
    });
  }

  if (error instanceof ZodError) {
    return sendError(res, 422, "Invalid request data", {
      code: "VALIDATION_ERROR",
      details: error.flatten(),
      requestId,
    });
  }

  console.error("Unhandled error", error);
  return sendError(res, 500, "Internal server error", {
    code: "INTERNAL_SERVER_ERROR",
    requestId,
  });
};
