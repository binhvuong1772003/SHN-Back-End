import { db } from "@/db/prisma";
import { redisConnection } from "@/config/redis";
import { aiConversationMessagesCacheKey } from "@/cache/cacheKeys";
import { AiMessageRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";

const MAX_CONTEXT_MESSAGES = 20;
const CONTEXT_TTL_SECONDS = 7 * 24 * 60 * 60;
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export interface AiConversationScope {
  userId: string;
  shopId: string;
  conversationId?: string;
}

export interface AiContextMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
}

export const getOrCreateAiConversation = async ({
  userId,
  shopId,
  conversationId,
}: AiConversationScope) => {
  if (conversationId !== undefined) {
    if (!objectIdPattern.test(conversationId)) {
      throw new ApiError(400, "Invalid conversationId");
    }

    const existing = await db.aiConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        shopId,
        status: "ACTIVE",
      },
    });

    if (!existing) {
      throw new ApiError(404, "Conversation not found");
    }

    return existing;
  }

  return db.aiConversation.create({
    data: {
      userId,
      shopId,
      status: "ACTIVE",
    },
  });
};

export const listAiConversationsService = async (
  shopSlug: string,
  userId: string,
  query: { cursor?: string; limit: number },
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  if (query.cursor !== undefined && !objectIdPattern.test(query.cursor)) {
    throw new ApiError(400, "Invalid conversation cursor");
  }

  if (query.cursor !== undefined) {
    const cursorConversation = await db.aiConversation.findFirst({
      where: {
        id: query.cursor,
        userId,
        shopId: shop.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!cursorConversation) {
      throw new ApiError(400, "Invalid conversation cursor");
    }
  }

  const conversations = await db.aiConversation.findMany({
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

export const listAiConversationMessagesService = async (
  shopSlug: string,
  userId: string,
  conversationId: string,
  query: { cursor?: string; limit: number },
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  if (!objectIdPattern.test(conversationId)) {
    throw new ApiError(400, "Invalid conversationId");
  }
  if (query.cursor !== undefined && !objectIdPattern.test(query.cursor)) {
    throw new ApiError(400, "Invalid message cursor");
  }

  const conversation = await db.aiConversation.findFirst({
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
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const messages = await db.aiMessage.findMany({
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

export const loadAiConversationContext = async (
  scope: Required<
    Pick<AiConversationScope, "userId" | "shopId" | "conversationId">
  >,
): Promise<AiContextMessage[]> => {
  const key = aiConversationMessagesCacheKey(
    scope.shopId,
    scope.userId,
    scope.conversationId,
  );

  try {
    const cached = await redisConnection.lrange(key, -MAX_CONTEXT_MESSAGES, -1);
    const parsed = cached
      .map((item) => {
        try {
          return JSON.parse(item) as AiContextMessage;
        } catch {
          return null;
        }
      })
      .filter((item): item is AiContextMessage => item !== null);

    if (parsed.length > 0) return parsed;
  } catch (error) {
    console.error(`[Redis] AI conversation read failed for ${key}:`, error);
  }

  const messages = await db.aiMessage.findMany({
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
    role: message.role.toLowerCase() as AiContextMessage["role"],
    content: message.content,
    ...(message.toolName ? { toolName: message.toolName } : {}),
  }));

  await writeAiConversationCache(key, context);
  return context;
};

export const saveAiMessage = async (params: {
  conversationId: string;
  userId: string;
  shopId: string;
  role: AiMessageRole;
  content: string;
  toolName?: string;
  toolCallId?: string;
  model?: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  const message = await db.aiMessage.create({
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

  await db.aiConversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  const key = aiConversationMessagesCacheKey(
    params.shopId,
    params.userId,
    params.conversationId,
  );
  const contextMessage: AiContextMessage = {
    role: params.role.toLowerCase() as AiContextMessage["role"],
    content: params.content,
    ...(params.toolName ? { toolName: params.toolName } : {}),
  };

  try {
    await redisConnection.rpush(key, JSON.stringify(contextMessage));
    await redisConnection.ltrim(key, -MAX_CONTEXT_MESSAGES, -1);
    await redisConnection.expire(key, CONTEXT_TTL_SECONDS);
  } catch (error) {
    console.error(`[Redis] AI conversation write failed for ${key}:`, error);
  }

  return message;
};

const writeAiConversationCache = async (
  key: string,
  messages: AiContextMessage[],
) => {
  if (messages.length === 0) return;

  try {
    const pipeline = redisConnection.multi();
    pipeline.del(key);
    pipeline.rpush(key, ...messages.map((message) => JSON.stringify(message)));
    pipeline.expire(key, CONTEXT_TTL_SECONDS);
    await pipeline.exec();
  } catch (error) {
    console.error(
      `[Redis] AI conversation cache hydrate failed for ${key}:`,
      error,
    );
  }
};
