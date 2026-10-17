import { z } from "zod";
import { getService } from "@/service/service/service.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  category: z.string().trim().max(100).optional(),
  sort: z
    .enum([
      "RECENT",
      "NAME_ASC",
      "NAME_DESC",
      "PRICE_ASC",
      "PRICE_DESC",
      "DURATION_ASC",
      "DURATION_DESC",
    ])
    .optional(),
};

type GetServiceListInput = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  category?: string;
  sort?:
    | "RECENT"
    | "NAME_ASC"
    | "NAME_DESC"
    | "PRICE_ASC"
    | "PRICE_DESC"
    | "DURATION_ASC"
    | "DURATION_DESC";
};

interface GetServiceListOutput {
  items: Array<{
    serviceId: string;
    name: string;
    description: string | null;
    basePrice: number | null;
    durationMin: number;
    category: string | null;
    isActive: boolean;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    all: number;
    active: number;
    inactive: number;
    categories: number;
  };
}

export const getServiceListMcpTool: McpToolDefinition<
  GetServiceListInput,
  GetServiceListOutput
> = {
  name: "get_service_list",
  description:
    "Get a compact list of services in the current shop. Supports search, category, active status, pagination, and sorting. Return service name, price, duration, category, and status only.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetServiceListInput, context: McpContext) => {
    const result = await getService(context.shopSlug, {
      page: input.page ?? 1,
      limit: input.limit ?? 20,
      search: input.search,
      status: input.status,
      category: input.category,
      sort: input.sort,
    });

    return {
      items: result.items.map((service) => ({
        serviceId: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        durationMin: service.durationMin,
        category: service.category?.name ?? null,
        isActive: service.isActive,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      counts: result.counts,
    };
  },
};
