import { dateOnlySchema, objectIdSchema } from "@/validation/common.validate";
import { getShopAttendanceService } from "@/service/staff/attendance.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";
import { z } from "zod";

const inputSchema = {
  staffId: objectIdSchema.describe("ShopStaff ID of the staff member."),
  date: dateOnlySchema.optional().describe("Specific date, YYYY-MM-DD."),
  from: dateOnlySchema.optional().describe("Start date, YYYY-MM-DD."),
  to: dateOnlySchema.optional().describe("End date, YYYY-MM-DD."),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};

type GetStaffAttendanceInput = {
  staffId: string;
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

interface GetStaffAttendanceOutput {
  items: Array<{
    attendanceId: string;
    staffId: string;
    staffName: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    lateMinutes: number;
    workMinutes: number;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getStaffAttendanceMcpTool: McpToolDefinition<
  GetStaffAttendanceInput,
  GetStaffAttendanceOutput
> = {
  name: "get_staff_attendance",
  description:
    "Get compact attendance records for a specific staff member in the current shop. Use staffId from get_staff_list or find_staff.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input, context) => {
    const result = await getShopAttendanceService(context.shopSlug, input);

    return {
      items: result.items.map((item) => ({
        attendanceId: item.id,
        staffId: item.shopStaffId,
        staffName: item.shopStaff.user.name,
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
