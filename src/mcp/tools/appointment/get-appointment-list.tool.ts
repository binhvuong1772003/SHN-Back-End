import { dateOnlySchema, objectIdSchema } from "@/validation/common.validate";
import { getAppointmentsByDay } from "@/service/appointment/appointment.service";
import type { McpContext } from "../../types/mcp-context";
import type { McpToolDefinition } from "../../types/tool";

const inputSchema = {
  staffId: objectIdSchema.describe("ShopStaff ID of the staff member."),
  date: dateOnlySchema
    .optional()
    .describe("Date formatted as YYYY-MM-DD. Omit for today."),
};

type GetStaffAppointmentsInput = {
  staffId: string;
  date?: string;
};

interface GetStaffAppointmentsOutput {
  date: string;
  staffId: string;
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

export const getStaffAppointmentsMcpTool: McpToolDefinition<
  GetStaffAppointmentsInput,
  GetStaffAppointmentsOutput
> = {
  name: "get_staff_appointments",
  description:
    "Get a compact list of appointments for a specific staff member in the current shop. Use the staffId from get_staff_list or find_staff. Omit date for today; provide YYYY-MM-DD for another date.",
  access: "SHOP_READ",
  mode: "read",
  inputSchema,
  execute: async (input: GetStaffAppointmentsInput, context: McpContext) => {
    const date = input.date ?? context.currentDate;
    const appointments = await getAppointmentsByDay(
      context.shopSlug,
      date,
      input.staffId,
    );

    return {
      date,
      staffId: input.staffId,
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
