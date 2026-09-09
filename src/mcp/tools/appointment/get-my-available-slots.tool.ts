import { z } from "zod";
import { dateOnlySchema } from "@/validation/common.validate";
import { getAvailableSlotsForStaffUser } from "@/service/calendar/calendar.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  date: dateOnlySchema
    .optional()
    .describe("Date formatted as YYYY-MM-DD. Omit for today."),
  durationMin: z.coerce
    .number()
    .int()
    .min(15)
    .max(480)
    .describe("Required appointment duration in minutes."),
};

type GetMyAvailableSlotsInput = {
  date?: string;
  durationMin: number;
};

type GetMyAvailableSlotsOutput = Awaited<
  ReturnType<typeof getAvailableSlotsForStaffUser>
>;

export const getMyAvailableSlotsMcpTool: McpToolDefinition<
  GetMyAvailableSlotsInput,
  GetMyAvailableSlotsOutput
> = {
  name: "get_my_available_slots",
  description:
    "Get available appointment slots for the authenticated staff member. Omit date for today and provide the appointment duration in minutes.",
  access: "SELF_READ",
  mode: "read",
  inputSchema,
  execute: async (input, context) =>
    getAvailableSlotsForStaffUser({
      shopSlug: context.shopSlug,
      userId: context.userId,
      date: input.date ?? context.currentDate,
      durationMin: input.durationMin,
    }),
};
