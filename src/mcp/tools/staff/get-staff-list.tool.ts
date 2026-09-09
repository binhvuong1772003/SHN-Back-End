import { z } from "zod";
import { getStaffListByShopService } from "@/service/staff/staff.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  sort: z.enum(["RECENT", "NAME_ASC", "NAME_DESC", "REVENUE"]).optional(),
};

type GetStaffListInput = {
  page?: number;
  limit?: number;
  search?: string;
  role?: "OWNER" | "MANAGER" | "STAFF";
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  sort?: "RECENT" | "NAME_ASC" | "NAME_DESC" | "REVENUE";
};

interface GetStaffListOutput {
  items: Array<{
    staffId: string;
    name: string;
    nickname: string | null;
    role: "OWNER" | "MANAGER" | "STAFF";
    status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getStaffListMcpTool: McpToolDefinition<
  GetStaffListInput,
  GetStaffListOutput
> = {
  name: "get_staff_list",
  description:
    "Get a compact list of staff members in the current shop. Return only name, nickname, role, and work status; never expose email or other private profile fields unless explicitly requested.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetStaffListInput, context: McpContext) => {
    const result = await getStaffListByShopService(context.shopSlug, {
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      search: input.search,
      role: input.role,
      status: input.status,
      sort: input.sort,
    });

    return {
      items: result.items.map((staff) => ({
        staffId: staff.id,
        name: staff.user.name,
        nickname: staff.nickname,
        role: staff.role,
        status: staff.isOnLeave
          ? "ON_LEAVE"
          : staff.isActive
            ? "ACTIVE"
            : "INACTIVE",
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },
};
