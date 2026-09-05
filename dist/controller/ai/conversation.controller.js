"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAiConversationMessagesController = exports.listAiConversationsController = void 0;
const conversation_service_1 = require("../../service/ai/conversation.service");
const listAiConversationsController = async (req, res, next) => {
    try {
        const result = await (0, conversation_service_1.listAiConversationsService)(req.params.shopSlug, req.user.userId, req.query);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listAiConversationsController = listAiConversationsController;
const listAiConversationMessagesController = async (req, res, next) => {
    try {
        const result = await (0, conversation_service_1.listAiConversationMessagesService)(req.params.shopSlug, req.user.userId, req.params.conversationId, req.query);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listAiConversationMessagesController = listAiConversationMessagesController;
