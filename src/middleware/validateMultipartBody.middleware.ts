import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { sendError } from "@/utils/apiResponse";

export const validateMultipartBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(req.body.data) as Record<string, unknown>;
    } catch {
      return sendError(res, 400, "Invalid request data", { code: "VALIDATION_ERROR" });
    }

    if (req.body.imageUrl) payload.imageUrl = req.body.imageUrl;

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return sendError(res, 422, "Invalid request data", {
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      });
    }

    req.body = parsed.data;
    next();
  };
};
