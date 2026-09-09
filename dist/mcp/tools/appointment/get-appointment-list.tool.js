"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffAppointmentsMcpTool = void 0;
const common_validate_1 = require("../../../validation/common.validate");
const appointment_service_1 = require("../../../service/appointment/appointment.service");
const inputSchema = {
    staffId: common_validate_1.objectIdSchema.describe("ShopStaff ID of the staff member."),
    date: common_validate_1.dateOnlySchema
        .optional()
        .describe("Date formatted as YYYY-MM-DD. Omit for today."),
};
exports.getStaffAppointmentsMcpTool = {
    name: "get_staff_appointments",
    description: "Get a compact list of appointments for a specific staff member in the current shop. Use the staffId from get_staff_list or find_staff. Omit date for today; provide YYYY-MM-DD for another date.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const date = input.date ?? context.currentDate;
        const appointments = await (0, appointment_service_1.getAppointmentsByDay)(context.shopSlug, date, input.staffId);
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
