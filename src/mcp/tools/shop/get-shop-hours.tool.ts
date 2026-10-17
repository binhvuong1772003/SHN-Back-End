import { getBusinessHoursService } from "@/service/shop/shop.service";
import { dateOnlySchema } from "@/validation/common.validate";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  date: dateOnlySchema
    .optional()
    .describe("Date formatted as YYYY-MM-DD. Omit to return the weekly hours."),
};

type GetShopHoursInput = {
  date?: string;
};

interface GetShopHoursOutput {
  date: string | null;
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
}

export const getShopHoursMcpTool: McpToolDefinition<
  GetShopHoursInput,
  GetShopHoursOutput
> = {
  name: "get_shop_hours",
  description:
    "Get the current shop's business hours. Omit date for weekly hours or provide YYYY-MM-DD to inspect a specific day.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetShopHoursInput, context: McpContext) => {
    const hours = await getBusinessHoursService(context.shopSlug);
    const selectedHours = input.date
      ? hours.filter(
          (item) =>
            item.dayOfWeek ===
            new Date(`${input.date}T00:00:00.000Z`).getUTCDay(),
        )
      : hours;

    return {
      date: input.date ?? null,
      hours: selectedHours.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        openTime: item.openTime,
        closeTime: item.closeTime,
        isClosed: item.isClosed,
      })),
    };
  },
};
