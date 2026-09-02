import { tool } from "@openai/agents";
import { z } from "zod";
import { getMyStaffScheduleByDateService } from "@/service/staff/staff.service";
import type { SalonAgentContext } from "../types/agent-context";

const getMyScheduleParameters = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
    .describe("Date formatted as YYYY-MM-DD"),
});

export const getMyScheduleTool = tool<
  typeof getMyScheduleParameters,
  SalonAgentContext
>({
  name: "get_my_schedule",
  description:
    "Get the authenticated staff member's work schedule for a specific date.",
  parameters: getMyScheduleParameters,
  execute: async ({ date }, runContext) => {
    if (!runContext) throw new Error("Salon agent context is required");
    const { userId, shopSlug } = runContext.context;
    return getMyStaffScheduleByDateService(shopSlug, userId, date);
  },
});
