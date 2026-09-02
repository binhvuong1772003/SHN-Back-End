import { z } from "zod";
import { getMyStaffScheduleByDateService } from "@/service/staff/staff.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
    .describe("Date formatted as YYYY-MM-DD"),
};

type GetMyScheduleInput = {
  date: string;
};

type GetMyScheduleOutput = Awaited<
  ReturnType<typeof getMyStaffScheduleByDateService>
>;

export const getMyScheduleMcpTool: McpToolDefinition<
  typeof inputSchema,
  GetMyScheduleOutput
> = {
  name: "get_my_schedule",
  description:
    "Get the authenticated staff member's work schedule for a specific date.",
  access: "SELF_READ",
  inputSchema,
  execute: async (input: GetMyScheduleInput, context: McpContext) =>
    getMyStaffScheduleByDateService(context.shopSlug, context.userId, input.date),
};
