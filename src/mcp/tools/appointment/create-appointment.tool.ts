import { z } from "zod";
import { createAppointment } from "@/service/appointment/appointment.service";
import { dateOnlySchema, objectIdSchema } from "@/validation/common.validate";
import type { CreateAppointmentInput } from "@/validation/appointment";
import { runWithMcpIdempotency } from "../../idempotency";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  idempotencyKey: z.string().trim().min(1).max(200),
  customerId: objectIdSchema.describe(
    "User ID of the customer booking the appointment.",
  ),
  date: dateOnlySchema.describe("Appointment date formatted as YYYY-MM-DD."),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "startTime must use HH:mm format")
    .describe("Appointment start time formatted as HH:mm."),
  staffId: objectIdSchema
    .optional()
    .describe("ShopStaff ID of the assigned staff member."),
  serviceIds: z
    .array(objectIdSchema)
    .optional()
    .describe("IDs of the services to book."),
  serviceOptions: z
    .array(
      z.object({
        serviceId: objectIdSchema,
        optionValueIds: z.array(objectIdSchema),
      }),
    )
    .optional()
    .describe("Selected option values for services that require options."),
  packageIds: z
    .array(objectIdSchema)
    .optional()
    .describe("IDs of service packages to book."),
  addonIds: z
    .array(objectIdSchema)
    .optional()
    .describe("IDs of add-ons to include."),
  note: z.string().max(500).optional(),
  source: z
    .enum(["APP", "WALK_IN", "PHONE", "ZALO", "WEBSITE"])
    .optional()
    .describe("Booking source. Defaults to PHONE for this tool."),
  promotionId: objectIdSchema.optional(),
};

type CreateAppointmentToolInput = {
  idempotencyKey: string;
  customerId: string;
  date: string;
  startTime: string;
  staffId?: string;
  serviceIds?: string[];
  serviceOptions?: NonNullable<CreateAppointmentInput["serviceOptions"]>;
  packageIds?: string[];
  addonIds?: string[];
  note?: string;
  source?: CreateAppointmentInput["source"];
  promotionId?: string;
};

interface CreateAppointmentToolOutput {
  appointmentId: string;
  customerId: string;
  staffId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  services: string[];
  totalAmount: number;
}

export const createAppointmentMcpTool: McpToolDefinition<
  CreateAppointmentToolInput,
  CreateAppointmentToolOutput
> = {
  name: "create_appointment",
  description:
    "Create an appointment for a customer in the current shop. The backend validates service availability, staff schedule, staff-service assignments, and slot conflicts before creating the booking.",
  access: "APPOINTMENT_WRITE",
  mode: "write",
  inputSchema,
  execute: async (input: CreateAppointmentToolInput, context: McpContext) =>
    runWithMcpIdempotency(
      {
        shopId: context.shopId,
        userId: context.userId,
        operation: "create_appointment",
        idempotencyKey: input.idempotencyKey,
      },
      async () => {
        const appointment = await createAppointment(
          {
            date: input.date,
            startTime: input.startTime,
            staffId: input.staffId,
            serviceIds: input.serviceIds,
            serviceOptions: input.serviceOptions,
            packageIds: input.packageIds,
            addonIds: input.addonIds,
            note: input.note,
            source: input.source ?? "PHONE",
            promotionId: input.promotionId,
          },
          input.customerId,
          context.shopSlug,
          context.userId,
        );

        return {
          appointmentId: appointment.id,
          customerId: appointment.customerId,
          staffId: input.staffId ?? null,
          date: input.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          services: appointment.services.map((service) => service.serviceName),
          totalAmount: appointment.totalAmount,
        };
      },
    ),
};
