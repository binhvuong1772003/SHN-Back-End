import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  [key: string]: unknown;
}

export interface SuccessResponseOptions {
  statusCode?: number;
  message?: string;
  meta?: unknown;
}

export interface ErrorResponseOptions {
  code?: string;
  details?: unknown;
  requestId?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T = null as T,
  options: SuccessResponseOptions = {},
) => {
  const { statusCode = 200, message, meta } = options;

  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta !== undefined ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  options: ErrorResponseOptions = {},
) => {
  const { code = "API_ERROR", details = null, requestId } = options;

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      ...(requestId ? { requestId } : {}),
    },
  });
};
