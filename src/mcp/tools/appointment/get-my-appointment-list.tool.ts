import { z } from "zod";
import { dateOnlySchema } from "@/validation/common.validate";
import { getAppointmentsByDay } from "@/service/appointment/appointment.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  date: dateOnlySchema
    .optional()
    .describe("Date formatted as YYYY-MM-DD. Omit for today."),
};

type GetMyAppointmentsInput = {
  date?: string;
};

interface GetMyAppointmentsOutput {
  date: string;
  items: Array<{
    appointmentId: string;
    startTime: string;
    endTime: string;
    status: string;
    customerName: string;
    services: string[];
    totalAmount: number;
  }>;
  total: number;
}

export const getMyAppointmentsMcpTool: McpToolDefinition<
  GetMyAppointmentsInput,
  GetMyAppointmentsOutput
> = {
  name: "get_my_appointments",
  description:
    "Get a compact list of the authenticated user's appointments. Use the authenticated userId from context; never ask for the user's name or staff ID. Omit date for today; provide YYYY-MM-DD for another date.",
  access: "SELF_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetMyAppointmentsInput, context: McpContext) => {
    const date = input.date ?? context.currentDate;
    const appointments = await getAppointmentsByDay(
      context.shopSlug,
      date,
      context.userId,
    );

    return {
      date,
      total: appointments.length,
      items: appointments.map((appointment) => ({
        appointmentId: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        customerName: appointment.customer.name,
        services: appointment.services.map((service) => service.serviceName),
        totalAmount: appointment.totalAmount,
      })),
    };
  },
};
