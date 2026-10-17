import { z } from "zod";
import { changeAppointmentStatus } from "@/service/appointment/appointment.service";
import { objectIdSchema } from "@/validation/common.validate";
import { runWithMcpIdempotency } from "../../idempotency";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  idempotencyKey: z.string().trim().min(1).max(200),
  appointmentId: objectIdSchema,
  reason: z.string().trim().min(1).max(500),
};

type CancelAppointmentToolInput = {
  idempotencyKey: string;
  appointmentId: string;
  reason: string;
};

interface CancelAppointmentToolOutput {
  appointmentId: string;
  status: string;
  reason: string;
}

export const cancelAppointmentMcpTool: McpToolDefinition<
  CancelAppointmentToolInput,
  CancelAppointmentToolOutput
> = {
  name: "cancel_appointment",
  description:
    "Cancel a pending or confirmed appointment in the current shop. A cancellation reason is required and the operation is idempotent.",
  access: "APPOINTMENT_WRITE",
  mode: "write",
  inputSchema,
  execute: async (input: CancelAppointmentToolInput, context: McpContext) =>
    runWithMcpIdempotency(
      {
        shopId: context.shopId,
        userId: context.userId,
        operation: "cancel_appointment",
        idempotencyKey: input.idempotencyKey,
      },
      async () => {
        const appointment = await changeAppointmentStatus(
          context.shopSlug,
          input.appointmentId,
          "CANCELLED",
          context.userId,
          context.role,
          input.reason,
          input.reason,
        );

        return {
          appointmentId: appointment.id,
          status: appointment.status,
          reason: input.reason,
        };
      },
    ),
};
