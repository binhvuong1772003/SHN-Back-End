"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAppointmentsMcpTool = void 0;
const common_validate_1 = require("../../../validation/common.validate");
const appointment_service_1 = require("../../../service/appointment/appointment.service");
const inputSchema = {
    date: common_validate_1.dateOnlySchema
        .optional()
        .describe("Date formatted as YYYY-MM-DD. Omit for today."),
};
exports.getMyAppointmentsMcpTool = {
    name: "get_my_appointments",
    description: "Get a compact list of the authenticated user's appointments. Use the authenticated userId from context; never ask for the user's name or staff ID. Omit date for today; provide YYYY-MM-DD for another date.",
    access: "SELF_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const date = input.date ?? context.currentDate;
        const appointments = await (0, appointment_service_1.getAppointmentsByDay)(context.shopSlug, date, context.userId);
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
