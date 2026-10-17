import { z } from "zod";
import { findShopCustomers } from "@/service/customer/customer.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(6).max(20).optional(),
};

type FindCustomerInput = {
  email?: string;
  phone?: string;
};

type FindCustomerOutput = {
  items: Array<{
    customerId: string;
    shopCustomerId: string;
    name: string;
    email: string;
    phone: string | null;
    totalBookings: number;
    totalVisits: number;
    totalSpent: number;
    lastVisitAt: string | null;
  }>;
};

export const findCustomerMcpTool: McpToolDefinition<
  FindCustomerInput,
  FindCustomerOutput
> = {
  name: "find_customer",
  description:
    "Find customers who have already used a service at the current shop by exact email or phone. Returns User customerId for create_appointment; do not use shopCustomerId as customerId.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input: FindCustomerInput, context: McpContext) => {
    const customers = await findShopCustomers(context.shopSlug, input);
    return {
      items: customers.map((item) => ({
        customerId: item.customerId,
        shopCustomerId: item.id,
        name: item.customer.name,
        email: item.customer.email,
        phone: item.customer.phone,
        totalBookings: item.totalBookings,
        totalVisits: item.totalVisits,
        totalSpent: item.totalSpent,
        lastVisitAt: item.lastVisitAt?.toISOString() ?? null,
      })),
    };
  },
};
