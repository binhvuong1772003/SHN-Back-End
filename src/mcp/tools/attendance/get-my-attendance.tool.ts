import { dateOnlySchema } from "@/validation/common.validate";
import { getMyAttendanceHistoryService } from "@/service/staff/attendance.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";
import { z } from "zod";

const inputSchema = {
  from: dateOnlySchema.optional().describe("Start date, YYYY-MM-DD."),
  to: dateOnlySchema.optional().describe("End date, YYYY-MM-DD."),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};

type GetMyAttendanceInput = {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

interface AttendanceItem {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  workMinutes: number;
}

interface GetMyAttendanceOutput {
  items: AttendanceItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getMyAttendanceMcpTool: McpToolDefinition<
  GetMyAttendanceInput,
  GetMyAttendanceOutput
> = {
  name: "get_my_attendance",
  description:
    "Get the authenticated staff member's attendance history. Use from/to for a date range, or omit them for the current month.",
  access: "SELF_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetMyAttendanceInput, context: McpContext) => {
    const result = await getMyAttendanceHistoryService(
      context.shopSlug,
      context.userId,
      input,
    );

    return {
      items: result.items.map((item) => ({
        date: item.date.toISOString(),
        checkIn: item.checkIn?.toISOString() ?? null,
        checkOut: item.checkOut?.toISOString() ?? null,
        status: item.status,
        lateMinutes: item.lateMinutes,
        workMinutes: item.workMinutes,
      })),
      meta: result.meta,
    };
  },
};
