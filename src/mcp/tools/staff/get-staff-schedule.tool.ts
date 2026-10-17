import { dateOnlySchema, objectIdSchema } from '@/validation/common.validate';
import { getStaffScheduleByDateService } from '@/service/staff/staff.service';
import type { McpContext } from '../../types/mcp-context';
import type { McpToolDefinition } from '../../types/tool';

const inputSchema = {
  staffId: objectIdSchema
    .describe('ShopStaff ID of the staff member to get the schedule for.'),
  date: dateOnlySchema
    .optional()
    .describe('Date formatted as YYYY-MM-DD. Omit for today.'),
};

type GetStaffScheduleInput = {
  date?: string;
  staffId: string;
};

type GetStaffScheduleOutput = Awaited<
  ReturnType<typeof getStaffScheduleByDateService>
>;

export const getStaffScheduleMcpTool: McpToolDefinition<
  GetStaffScheduleInput,
  GetStaffScheduleOutput
> = {
  name: 'get_staff_schedule',
  description: "Get a specific staff member's work schedule.",
  access: 'SHOP_READ',
  mode: 'read',
  inputSchema,
  execute: async (input: GetStaffScheduleInput, context: McpContext) =>
    getStaffScheduleByDateService(
      context.shopSlug,
      input.staffId,
      input.date ?? context.currentDate,
    ),
};
