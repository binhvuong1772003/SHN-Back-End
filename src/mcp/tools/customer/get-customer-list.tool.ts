import { z } from "zod";
import { dateOnlySchema } from "@/validation/common.validate";
import { getCustomerList } from "@/service/customer/customer.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
  sort: z
    .enum([
      "SPEND_DESC",
      "VISITS_DESC",
      "RECENT_VISIT",
      "LONGEST_INACTIVE",
      "NEWEST",
    ])
    .optional(),
  retention: z.enum(["ALL", "NEW", "RETURNING"]).optional(),
  hasUpcomingAppointment: z.boolean().optional(),
  lastVisitBefore: dateOnlySchema.optional(),
};

type GetCustomerListInput = {
  page?: number;
  limit?: number;
  search?: string;
  sort?:
    | "SPEND_DESC"
    | "VISITS_DESC"
    | "RECENT_VISIT"
    | "LONGEST_INACTIVE"
    | "NEWEST";
  retention?: "ALL" | "NEW" | "RETURNING";
  hasUpcomingAppointment?: boolean;
  lastVisitBefore?: string;
};

type GetCustomerListOutput = Awaited<ReturnType<typeof getCustomerList>>;

export const getCustomerListMcpTool: McpToolDefinition<
  GetCustomerListInput,
  GetCustomerListOutput
> = {
  name: "get_customer_list",
  description:
    "Get a paginated list of customers who have used services at the current shop. Search by customer name or email, filter by retention and upcoming appointments, and sort by spending or visits.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetCustomerListInput, context: McpContext) =>
    getCustomerList(context.shopSlug, {
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      search: input.search,
      sort: input.sort,
      retention: input.retention,
      hasUpcomingAppointment: input.hasUpcomingAppointment,
      lastVisitBefore: input.lastVisitBefore,
      usedOnly: true,
    }),
};
