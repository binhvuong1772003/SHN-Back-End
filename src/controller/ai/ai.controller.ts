// src/controller/ai/ai.controller.ts

import { Request, Response, NextFunction } from "express";

import { askAIService } from "@/service/ai/ai.service";
import { ApiError } from "@/utils/ApiError";

export const chatAIController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { message } = req.body as { message?: unknown };
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new ApiError(400, "Message is required");
    }

    const shopSlug = req.params.shopSlug as string;
    if (!req.shopStaff) {
      throw new ApiError(403, "Shop membership is required");
    }

    const result = await askAIService(message.trim(), {
      userId: req.user!.userId,
      shopSlug,
      role: req.shopStaff.role,
      permissions: req.shopStaff.permissions,
      requestId: req.headers["x-request-id"] as string | undefined,
    });

    res.status(200).json({
      success: true,

      data: {
        message: result,
      },
    });
  } catch (error) {
    next(error);
  }
};
