import { z } from "zod";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { dateOnlySchema } from "@/validation/common.validate";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import { requestOffDayService } from "@/service/staff/offDay.service";
import { runWithMcpIdempotency } from "../../idempotency";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

dayjs.extend(utc);
dayjs.extend(timezone);

const inputSchema = {
  idempotencyKey: z.string().trim().min(1).max(200),
  offDate: dateOnlySchema.describe("Leave start date formatted as YYYY-MM-DD."),
  offDateEnd: dateOnlySchema
    .optional()
    .describe("Optional leave end date formatted as YYYY-MM-DD."),
  reason: z.string().trim().max(100).optional(),
};

type RequestOffDayToolInput = {
  idempotencyKey: string;
  offDate: string;
  offDateEnd?: string;
  reason?: string;
};

interface RequestOffDayToolOutput {
  offDayId: string;
  status: string;
  offDate: string;
  offDateEnd: string | null;
  reason: string | null;
}

export const requestOffDayMcpTool: McpToolDefinition<
  RequestOffDayToolInput,
  RequestOffDayToolOutput
> = {
  name: "request_off_day",
  description:
    "Submit a leave request for the authenticated staff member. The request is created as PENDING and requires manager approval.",
  access: "SELF_READ",
  mode: "write",
  inputSchema,
  execute: async (input: RequestOffDayToolInput, context: McpContext) =>
    runWithMcpIdempotency(
      {
        shopId: context.shopId,
        userId: context.userId,
        operation: "request_off_day",
        idempotencyKey: input.idempotencyKey,
      },
      async () => {
        const offDate = dayjs
          .tz(input.offDate, context.timezone)
          .startOf("day")
          .toDate();
        const offDateEnd = input.offDateEnd
          ? dayjs.tz(input.offDateEnd, context.timezone).startOf("day").toDate()
          : undefined;
        const today = dayjs
          .tz(context.currentDate, context.timezone)
          .startOf("day")
          .toDate();
        if (offDate < today) {
          throw new ApiError(400, "Off-day date cannot be in the past");
        }
        if (offDateEnd) {
          offDateEnd.setHours(0, 0, 0, 0);
          if (offDateEnd < offDate) {
            throw new ApiError(400, "End date must be after start date");
          }
        }

        const staff = await db.shopStaff.findFirst({
          where: {
            shopId: context.shopId,
            userId: context.userId,
            isActive: true,
          },
          select: { id: true },
        });
        if (!staff) {
          throw new ApiError(
            404,
            "Authenticated staff member not found in this shop",
          );
        }

        const offDay = await requestOffDayService(
          context.shopSlug,
          staff.id,
          context.userId,
          {
            offDate,
            offDateEnd,
            reason: input.reason,
          },
        );

        return {
          offDayId: offDay.id,
          status: offDay.status,
          offDate: offDay.offDate.toISOString(),
          offDateEnd: offDay.offDateEnd?.toISOString() ?? null,
          reason: offDay.reason,
        };
      },
    ),
};
