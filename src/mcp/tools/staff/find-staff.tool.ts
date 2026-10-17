import { z } from 'zod';
import { findStaffByNameService } from '@/service/staff/staff-search.service';
import type { McpContext } from '../../types/mcp-context';
import type { McpToolDefinition } from '../../types/tool';

const inputSchema = {
  staffName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe('Name or nickname of the staff member to search for.'),
};

type FindStaffInput = {
  staffName: string;
};

type FindStaffOutput = Awaited<
  ReturnType<typeof findStaffByNameService>
>;

export const findStaffMcpTool: McpToolDefinition<
  FindStaffInput,
  FindStaffOutput
> = {
  name: 'find_staff',
  description:
    'Find active staff members in the current shop by name or nickname. Returns matching staff members with their ShopStaff IDs. If multiple staff members match, return all candidates so the assistant can ask the user to clarify.',
  access: 'SHOP_READ',
  mode: 'read',
  inputSchema,
  execute: async (input: FindStaffInput, context: McpContext) =>
    findStaffByNameService(context.shopSlug, input.staffName),
};
