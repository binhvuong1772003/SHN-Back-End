"use strict";
// src/controller/ai/ai.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatAIController = void 0;
const ai_service_1 = require("../../service/ai/ai.service");
const ApiError_1 = require("../../utils/ApiError");
const chatAIController = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (typeof message !== "string" || message.trim().length === 0) {
            throw new ApiError_1.ApiError(400, "Message is required");
        }
        const shopSlug = req.params.shopSlug;
        if (!req.shopStaff) {
            throw new ApiError_1.ApiError(403, "Shop membership is required");
        }
        const result = await (0, ai_service_1.askAIService)(message.trim(), {
            userId: req.user.userId,
            shopSlug,
            role: req.shopStaff.role,
            permissions: req.shopStaff.permissions,
            requestId: req.headers["x-request-id"],
        });
        res.status(200).json({
            success: true,
            data: {
                message: result,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.chatAIController = chatAIController;
