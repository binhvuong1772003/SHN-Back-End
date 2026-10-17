// src/controller/ai/ai.controller.ts

import { Request, Response, NextFunction } from "express";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { askAIService } from "@/service/ai/ai.service";
import {
  getOrCreateAiConversation,
  listAiConversationsService,
  loadAiConversationContext,
  saveAiMessage,
} from "@/service/ai/conversation.service";
import { AiMessageRole } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";

dayjs.extend(utc);
dayjs.extend(timezone);

export const chatAIController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { message, conversationId } = req.body as {
      message?: unknown;
      conversationId?: unknown;
    };
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new ApiError(400, "Message is required");
    }
    if (conversationId !== undefined && typeof conversationId !== "string") {
      throw new ApiError(400, "Invalid conversationId");
    }

    const shopSlug = req.params.shopSlug as string;
    if (!req.shopStaff || !req.shop) {
      throw new ApiError(403, "Shop membership is required");
    }

    const context = {
      userId: req.user!.userId,
      shopId: req.shop.id,
      shopSlug,
      role: req.shopStaff.role,
      permissions: req.shopStaff.permissions,
      requestId: req.headers["x-request-id"] as string | undefined,
      timezone: req.shop.timezone,
      currentDate: dayjs().tz(req.shop.timezone).format("YYYY-MM-DD"),
    };
    const conversation = await getOrCreateAiConversation({
      userId: context.userId,
      shopId: context.shopId,
      conversationId,
    });
    const history = await loadAiConversationContext({
      userId: context.userId,
      shopId: context.shopId,
      conversationId: conversation.id,
    });

    await saveAiMessage({
      conversationId: conversation.id,
      userId: context.userId,
      shopId: context.shopId,
      role: AiMessageRole.USER,
      content: message.trim(),
    });

    const result = await askAIService(message.trim(), context, history);
    if (!result) {
      throw new ApiError(502, "AI returned an empty response");
    }

    await saveAiMessage({
      conversationId: conversation.id,
      userId: context.userId,
      shopId: context.shopId,
      role: AiMessageRole.ASSISTANT,
      content: result,
      model: process.env.OPENROUTER_MODEL,
    });

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: result,
      },
    });
  } catch (error) {
    next(error);
  }
};
