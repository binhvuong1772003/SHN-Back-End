"use strict";
// src/controller/ai/ai.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatAIController = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const ai_service_1 = require("../../service/ai/ai.service");
const conversation_service_1 = require("../../service/ai/conversation.service");
const client_1 = require("@prisma/client");
const ApiError_1 = require("../../utils/ApiError");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const chatAIController = async (req, res, next) => {
    try {
        const { message, conversationId } = req.body;
        if (typeof message !== "string" || message.trim().length === 0) {
            throw new ApiError_1.ApiError(400, "Message is required");
        }
        if (conversationId !== undefined && typeof conversationId !== "string") {
            throw new ApiError_1.ApiError(400, "Invalid conversationId");
        }
        const shopSlug = req.params.shopSlug;
        if (!req.shopStaff || !req.shop) {
            throw new ApiError_1.ApiError(403, "Shop membership is required");
        }
        const context = {
            userId: req.user.userId,
            shopId: req.shop.id,
            shopSlug,
            role: req.shopStaff.role,
            permissions: req.shopStaff.permissions,
            requestId: req.headers["x-request-id"],
            timezone: req.shop.timezone,
            currentDate: (0, dayjs_1.default)().tz(req.shop.timezone).format("YYYY-MM-DD"),
        };
        const conversation = await (0, conversation_service_1.getOrCreateAiConversation)({
            userId: context.userId,
            shopId: context.shopId,
            conversationId,
        });
        const history = await (0, conversation_service_1.loadAiConversationContext)({
            userId: context.userId,
            shopId: context.shopId,
            conversationId: conversation.id,
        });
        await (0, conversation_service_1.saveAiMessage)({
            conversationId: conversation.id,
            userId: context.userId,
            shopId: context.shopId,
            role: client_1.AiMessageRole.USER,
            content: message.trim(),
        });
        const result = await (0, ai_service_1.askAIService)(message.trim(), context, history);
        if (!result) {
            throw new ApiError_1.ApiError(502, "AI returned an empty response");
        }
        await (0, conversation_service_1.saveAiMessage)({
            conversationId: conversation.id,
            userId: context.userId,
            shopId: context.shopId,
            role: client_1.AiMessageRole.ASSISTANT,
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
    }
    catch (error) {
        next(error);
    }
};
exports.chatAIController = chatAIController;
