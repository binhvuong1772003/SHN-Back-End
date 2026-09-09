import { z } from "zod";
import { updateAppointment } from "@/service/appointment/appointment.service";
import { dateOnlySchema, objectIdSchema } from "@/validation/common.validate";
import { runWithMcpIdempotency } from "../../idempotency";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  idempotencyKey: z.string().trim().min(1).max(200),
  appointmentId: objectIdSchema,
  patch: z
    .object({
      date: dateOnlySchema.optional(),
      startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      staffId: objectIdSchema.nullable().optional(),
      note: z.string().max(500).nullable().optional(),
      internalNote: z.string().max(500).nullable().optional(),
    })
    .refine((patch) => Object.keys(patch).length > 0, {
      message: "At least one appointment field must be updated",
    }),
};

type UpdateAppointmentToolInput = {
  idempotencyKey: string;
  appointmentId: string;
  patch: {
    date?: string;
    startTime?: string;
    staffId?: string | null;
    note?: string | null;
    internalNote?: string | null;
  };
};

interface UpdateAppointmentToolOutput {
  appointmentId: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  staffId: string | null;
}

export const updateAppointmentMcpTool: McpToolDefinition<
  UpdateAppointmentToolInput,
  UpdateAppointmentToolOutput
> = {
  name: "update_appointment",
  description:
    "Update a pending or confirmed appointment in the current shop. Supports rescheduling date/time, changing staff, and editing notes. The backend revalidates staff capability and slot conflicts.",
  access: "APPOINTMENT_WRITE",
  mode: "write",
  inputSchema,
  execute: async (input: UpdateAppointmentToolInput, context: McpContext) =>
    runWithMcpIdempotency(
      {
        shopId: context.shopId,
        userId: context.userId,
        operation: "update_appointment",
        idempotencyKey: input.idempotencyKey,
      },
      async () => {
        const appointment = await updateAppointment(
          context.shopSlug,
          input.appointmentId,
          input.patch,
          context.userId,
          context.role,
        );

        return {
          appointmentId: appointment.id,
          status: appointment.status,
          date: appointment.date.toISOString(),
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          staffId: appointment.staffId,
        };
      },
    ),
};
