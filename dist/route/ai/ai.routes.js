"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../../controller/ai/ai.controller");
const conversation_controller_1 = require("../../controller/ai/conversation.controller");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const shop_middleware_1 = require("../../middleware/shop.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const ai_validate_1 = require("../../validation/ai.validate");
const common_validate_1 = require("../../validation/common.validate");
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/shops/:shopSlug/conversations", authenticate_middleware_1.authenticate, (0, shop_middleware_1.requireShopAccess)("STAFF"), (0, validation_middleware_1.validate)({ query: ai_validate_1.aiConversationListQuerySchema }), conversation_controller_1.listAiConversationsController);
router.get("/shops/:shopSlug/conversations/:conversationId/messages", authenticate_middleware_1.authenticate, (0, shop_middleware_1.requireShopAccess)("STAFF"), (0, validation_middleware_1.validate)({
    params: (0, common_validate_1.idParamSchema)("conversationId"),
    query: ai_validate_1.aiConversationMessageListQuerySchema,
}), conversation_controller_1.listAiConversationMessagesController);
router.post("/shops/:shopSlug/chat", authenticate_middleware_1.authenticate, (0, shop_middleware_1.requireShopAccess)("STAFF"), ai_controller_1.chatAIController);
exports.default = router;
