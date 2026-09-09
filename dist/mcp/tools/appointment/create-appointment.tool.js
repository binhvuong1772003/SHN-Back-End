"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentMcpTool = void 0;
const zod_1 = require("zod");
const appointment_service_1 = require("../../../service/appointment/appointment.service");
const common_validate_1 = require("../../../validation/common.validate");
const idempotency_1 = require("../../idempotency");
const inputSchema = {
    idempotencyKey: zod_1.z.string().trim().min(1).max(200),
    customerId: common_validate_1.objectIdSchema.describe("User ID of the customer booking the appointment."),
    date: common_validate_1.dateOnlySchema.describe("Appointment date formatted as YYYY-MM-DD."),
    startTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "startTime must use HH:mm format")
        .describe("Appointment start time formatted as HH:mm."),
    staffId: common_validate_1.objectIdSchema
        .optional()
        .describe("ShopStaff ID of the assigned staff member."),
    serviceIds: zod_1.z
        .array(common_validate_1.objectIdSchema)
        .optional()
        .describe("IDs of the services to book."),
    serviceOptions: zod_1.z
        .array(zod_1.z.object({
        serviceId: common_validate_1.objectIdSchema,
        optionValueIds: zod_1.z.array(common_validate_1.objectIdSchema),
    }))
        .optional()
        .describe("Selected option values for services that require options."),
    packageIds: zod_1.z
        .array(common_validate_1.objectIdSchema)
        .optional()
        .describe("IDs of service packages to book."),
    addonIds: zod_1.z
        .array(common_validate_1.objectIdSchema)
        .optional()
        .describe("IDs of add-ons to include."),
    note: zod_1.z.string().max(500).optional(),
    source: zod_1.z
        .enum(["APP", "WALK_IN", "PHONE", "ZALO", "WEBSITE"])
        .optional()
        .describe("Booking source. Defaults to PHONE for this tool."),
    promotionId: common_validate_1.objectIdSchema.optional(),
};
exports.createAppointmentMcpTool = {
    name: "create_appointment",
    description: "Create an appointment for a customer in the current shop. The backend validates service availability, staff schedule, staff-service assignments, and slot conflicts before creating the booking.",
    access: "APPOINTMENT_WRITE",
    mode: "write",
    inputSchema,
    execute: async (input, context) => (0, idempotency_1.runWithMcpIdempotency)({
        shopId: context.shopId,
        userId: context.userId,
        operation: "create_appointment",
        idempotencyKey: input.idempotencyKey,
    }, async () => {
        const appointment = await (0, appointment_service_1.createAppointment)({
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
        }, input.customerId, context.shopSlug, context.userId);
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
    }),
};
