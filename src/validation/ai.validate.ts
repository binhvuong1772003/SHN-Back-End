import { z } from "zod";
import { objectIdSchema } from "@/validation/common.validate";

export const aiConversationListQuerySchema = z.object({
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const aiConversationMessageListQuerySchema =
  aiConversationListQuerySchema;

export type AiConversationListQuery = z.infer<
  typeof aiConversationListQuerySchema
>;
