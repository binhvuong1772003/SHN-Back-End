"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAiMessage = exports.loadAiConversationContext = exports.listAiConversationMessagesService = exports.listAiConversationsService = exports.getOrCreateAiConversation = void 0;
const prisma_1 = require("../../db/prisma");
const redis_1 = require("../../config/redis");
const cacheKeys_1 = require("../../cache/cacheKeys");
const ApiError_1 = require("../../utils/ApiError");
const MAX_CONTEXT_MESSAGES = 20;
const CONTEXT_TTL_SECONDS = 7 * 24 * 60 * 60;
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const getOrCreateAiConversation = async ({ userId, shopId, conversationId, }) => {
    if (conversationId !== undefined) {
        if (!objectIdPattern.test(conversationId)) {
            throw new ApiError_1.ApiError(400, "Invalid conversationId");
        }
        const existing = await prisma_1.db.aiConversation.findFirst({
            where: {
                id: conversationId,
                userId,
                shopId,
                status: "ACTIVE",
            },
        });
        if (!existing) {
            throw new ApiError_1.ApiError(404, "Conversation not found");
        }
        return existing;
    }
    return prisma_1.db.aiConversation.create({
        data: {
            userId,
            shopId,
            status: "ACTIVE",
        },
    });
};
exports.getOrCreateAiConversation = getOrCreateAiConversation;
const listAiConversationsService = async (shopSlug, userId, query) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
        select: { id: true },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (query.cursor !== undefined && !objectIdPattern.test(query.cursor)) {
        throw new ApiError_1.ApiError(400, "Invalid conversation cursor");
    }
    if (query.cursor !== undefined) {
        const cursorConversation = await prisma_1.db.aiConversation.findFirst({
            where: {
                id: query.cursor,
                userId,
                shopId: shop.id,
                status: "ACTIVE",
            },
            select: { id: true },
        });
        if (!cursorConversation) {
            throw new ApiError_1.ApiError(400, "Invalid conversation cursor");
        }
    }
    const conversations = await prisma_1.db.aiConversation.findMany({
        where: {
            userId,
            shopId: shop.id,
            status: "ACTIVE",
        },
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        take: query.limit + 1,
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        select: {
            id: true,
            title: true,
            summary: true,
            status: true,
            lastMessageAt: true,
            createdAt: true,
            updatedAt: true,
            messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: {
                    role: true,
                    content: true,
                    createdAt: true,
                },
            },
        },
    });
    const hasMore = conversations.length > query.limit;
    const items = conversations.slice(0, query.limit).map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        summary: conversation.summary,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.messages[0] ?? null,
    }));
    return {
        items,
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
        hasMore,
    };
};
exports.listAiConversationsService = listAiConversationsService;
const listAiConversationMessagesService = async (shopSlug, userId, conversationId, query) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
        select: { id: true },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    if (!objectIdPattern.test(conversationId)) {
        throw new ApiError_1.ApiError(400, "Invalid conversationId");
    }
    if (query.cursor !== undefined && !objectIdPattern.test(query.cursor)) {
        throw new ApiError_1.ApiError(400, "Invalid message cursor");
    }
    const conversation = await prisma_1.db.aiConversation.findFirst({
        where: {
            id: conversationId,
            userId,
            shopId: shop.id,
        },
        select: {
            id: true,
            title: true,
            summary: true,
            status: true,
        },
    });
    if (!conversation)
        throw new ApiError_1.ApiError(404, "Conversation not found");
    const messages = await prisma_1.db.aiMessage.findMany({
        where: { conversationId },
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        take: query.limit + 1,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
            id: true,
            role: true,
            content: true,
            toolName: true,
            createdAt: true,
        },
    });
    const hasMore = messages.length > query.limit;
    const items = messages.slice(0, query.limit).reverse();
    return {
        conversation,
        items,
        nextCursor: hasMore && items.length > 0 ? items[0].id : null,
        hasMore,
    };
};
exports.listAiConversationMessagesService = listAiConversationMessagesService;
const loadAiConversationContext = async (scope) => {
    const key = (0, cacheKeys_1.aiConversationMessagesCacheKey)(scope.shopId, scope.userId, scope.conversationId);
    try {
        const cached = await redis_1.redisConnection.lrange(key, -MAX_CONTEXT_MESSAGES, -1);
        const parsed = cached
            .map((item) => {
            try {
                return JSON.parse(item);
            }
            catch {
                return null;
            }
        })
            .filter((item) => item !== null);
        if (parsed.length > 0)
            return parsed;
    }
    catch (error) {
        console.error(`[Redis] AI conversation read failed for ${key}:`, error);
    }
    const messages = await prisma_1.db.aiMessage.findMany({
        where: { conversationId: scope.conversationId },
        orderBy: { createdAt: "desc" },
        take: MAX_CONTEXT_MESSAGES,
        select: {
            role: true,
            content: true,
            toolName: true,
        },
    });
    const context = messages.reverse().map((message) => ({
        role: message.role.toLowerCase(),
        content: message.content,
        ...(message.toolName ? { toolName: message.toolName } : {}),
    }));
    await writeAiConversationCache(key, context);
    return context;
};
exports.loadAiConversationContext = loadAiConversationContext;
const saveAiMessage = async (params) => {
    const message = await prisma_1.db.aiMessage.create({
        data: {
            conversationId: params.conversationId,
            role: params.role,
            content: params.content,
            toolName: params.toolName,
            toolCallId: params.toolCallId,
            model: params.model,
            metadata: params.metadata,
        },
        select: {
            id: true,
            role: true,
            content: true,
            toolName: true,
            createdAt: true,
        },
    });
    await prisma_1.db.aiConversation.update({
        where: { id: params.conversationId },
        data: { lastMessageAt: message.createdAt },
    });
    const key = (0, cacheKeys_1.aiConversationMessagesCacheKey)(params.shopId, params.userId, params.conversationId);
    const contextMessage = {
        role: params.role.toLowerCase(),
        content: params.content,
        ...(params.toolName ? { toolName: params.toolName } : {}),
    };
    try {
        await redis_1.redisConnection.rpush(key, JSON.stringify(contextMessage));
        await redis_1.redisConnection.ltrim(key, -MAX_CONTEXT_MESSAGES, -1);
        await redis_1.redisConnection.expire(key, CONTEXT_TTL_SECONDS);
    }
    catch (error) {
        console.error(`[Redis] AI conversation write failed for ${key}:`, error);
    }
    return message;
};
exports.saveAiMessage = saveAiMessage;
const writeAiConversationCache = async (key, messages) => {
    if (messages.length === 0)
        return;
    try {
        const pipeline = redis_1.redisConnection.multi();
        pipeline.del(key);
        pipeline.rpush(key, ...messages.map((message) => JSON.stringify(message)));
        pipeline.expire(key, CONTEXT_TTL_SECONDS);
        await pipeline.exec();
    }
    catch (error) {
        console.error(`[Redis] AI conversation cache hydrate failed for ${key}:`, error);
    }
};
