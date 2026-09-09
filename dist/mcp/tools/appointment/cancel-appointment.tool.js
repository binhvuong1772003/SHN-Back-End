"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAppointmentMcpTool = void 0;
const zod_1 = require("zod");
const appointment_service_1 = require("../../../service/appointment/appointment.service");
const common_validate_1 = require("../../../validation/common.validate");
const idempotency_1 = require("../../idempotency");
const inputSchema = {
    idempotencyKey: zod_1.z.string().trim().min(1).max(200),
    appointmentId: common_validate_1.objectIdSchema,
    reason: zod_1.z.string().trim().min(1).max(500),
};
exports.cancelAppointmentMcpTool = {
    name: "cancel_appointment",
    description: "Cancel a pending or confirmed appointment in the current shop. A cancellation reason is required and the operation is idempotent.",
    access: "APPOINTMENT_WRITE",
    mode: "write",
    inputSchema,
    execute: async (input, context) => (0, idempotency_1.runWithMcpIdempotency)({
        shopId: context.shopId,
        userId: context.userId,
        operation: "cancel_appointment",
        idempotencyKey: input.idempotencyKey,
    }, async () => {
        const appointment = await (0, appointment_service_1.changeAppointmentStatus)(context.shopSlug, input.appointmentId, "CANCELLED", context.userId, context.role, input.reason, input.reason);
        return {
            appointmentId: appointment.id,
            status: appointment.status,
            reason: input.reason,
        };
    }),
};
