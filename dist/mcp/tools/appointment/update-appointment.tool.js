"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentMcpTool = void 0;
const zod_1 = require("zod");
const appointment_service_1 = require("../../../service/appointment/appointment.service");
const common_validate_1 = require("../../../validation/common.validate");
const idempotency_1 = require("../../idempotency");
const inputSchema = {
    idempotencyKey: zod_1.z.string().trim().min(1).max(200),
    appointmentId: common_validate_1.objectIdSchema,
    patch: zod_1.z
        .object({
        date: common_validate_1.dateOnlySchema.optional(),
        startTime: zod_1.z
            .string()
            .regex(/^\d{2}:\d{2}$/)
            .optional(),
        staffId: common_validate_1.objectIdSchema.nullable().optional(),
        note: zod_1.z.string().max(500).nullable().optional(),
        internalNote: zod_1.z.string().max(500).nullable().optional(),
    })
        .refine((patch) => Object.keys(patch).length > 0, {
        message: "At least one appointment field must be updated",
    }),
};
exports.updateAppointmentMcpTool = {
    name: "update_appointment",
    description: "Update a pending or confirmed appointment in the current shop. Supports rescheduling date/time, changing staff, and editing notes. The backend revalidates staff capability and slot conflicts.",
    access: "APPOINTMENT_WRITE",
    mode: "write",
    inputSchema,
    execute: async (input, context) => (0, idempotency_1.runWithMcpIdempotency)({
        shopId: context.shopId,
        userId: context.userId,
        operation: "update_appointment",
        idempotencyKey: input.idempotencyKey,
    }, async () => {
        const appointment = await (0, appointment_service_1.updateAppointment)(context.shopSlug, input.appointmentId, input.patch, context.userId, context.role);
        return {
            appointmentId: appointment.id,
            status: appointment.status,
            date: appointment.date.toISOString(),
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            staffId: appointment.staffId,
        };
    }),
};
