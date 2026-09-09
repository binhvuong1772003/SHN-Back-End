import { z } from "zod";
import { dateOnlySchema, objectIdSchema } from "@/validation/common.validate";
import { getAvailableSlots } from "@/service/calendar/calendar.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  staffId: objectIdSchema.describe("ShopStaff ID of the staff member."),
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

type GetStaffAvailableSlotsInput = {
  staffId: string;
  date?: string;
  durationMin: number;
};

type GetStaffAvailableSlotsOutput = Awaited<
  ReturnType<typeof getAvailableSlots>
>;

export const getStaffAvailableSlotsMcpTool: McpToolDefinition<
  GetStaffAvailableSlotsInput,
  GetStaffAvailableSlotsOutput
> = {
  name: "get_staff_available_slots",
  description:
    "Get available appointment slots for a specific staff member in the current shop. Use staffId from get_staff_list or find_staff.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input, context) =>
    getAvailableSlots({
      shopSlug: context.shopSlug,
      staffId: input.staffId,
      date: input.date ?? context.currentDate,
      durationMin: input.durationMin,
    }),
};
