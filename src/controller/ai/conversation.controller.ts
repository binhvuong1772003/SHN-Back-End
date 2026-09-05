import { Request, Response, NextFunction } from "express";
import {
  listAiConversationMessagesService,
  listAiConversationsService,
} from "@/service/ai/conversation.service";
import type { AiConversationListQuery } from "@/validation/ai.validate";

export const listAiConversationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await listAiConversationsService(
      req.params.shopSlug as string,
      req.user!.userId,
      req.query as unknown as AiConversationListQuery,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listAiConversationMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await listAiConversationMessagesService(
      req.params.shopSlug as string,
      req.user!.userId,
      req.params.conversationId as string,
      req.query as unknown as AiConversationListQuery,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
