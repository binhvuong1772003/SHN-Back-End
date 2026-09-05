import { z } from "zod";

export const mcpContextSchema = z.object({
  userId: z.string().min(1),
  shopId: z.string().min(1),
  shopSlug: z.string().min(1),
  role: z.enum(["STAFF", "MANAGER", "OWNER"]),
  permissions: z.array(z.string()),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestId: z.string().min(1).optional(),
  timezone: z.string().min(1),
});

export type McpContext = z.infer<typeof mcpContextSchema>;
