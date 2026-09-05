import { Router } from "express";
import { chatAIController } from "@/controller/ai/ai.controller";
import {
  listAiConversationMessagesController,
  listAiConversationsController,
} from "@/controller/ai/conversation.controller";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import {
  aiConversationListQuerySchema,
  aiConversationMessageListQuerySchema,
} from "@/validation/ai.validate";
import { idParamSchema } from "@/validation/common.validate";

const router = Router({ mergeParams: true });

router.get(
  "/shops/:shopSlug/conversations",
  authenticate,
  requireShopAccess("STAFF"),
  validate({ query: aiConversationListQuerySchema }),
  listAiConversationsController,
);

router.get(
  "/shops/:shopSlug/conversations/:conversationId/messages",
  authenticate,
  requireShopAccess("STAFF"),
  validate({
    params: idParamSchema("conversationId"),
    query: aiConversationMessageListQuerySchema,
  }),
  listAiConversationMessagesController,
);

router.post(
  "/shops/:shopSlug/chat",
  authenticate,
  requireShopAccess("STAFF"),
  chatAIController,
);

export default router;
