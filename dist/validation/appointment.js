"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeAppointmentStatusSchema = exports.getAppointmentsByDaySchema = exports.getAppointmentsSchema = exports.updateAppointmentStatusSchema = exports.createManagerAppointmentSchema = exports.createAppointmentSchema = exports.getAvailableSlotsSchema = exports.appointmentTransitionStatusSchema = exports.appointmentStatusSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const common_validate_1 = require("../validation/common.validate");
exports.appointmentStatusSchema = zod_1.default.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
]);
exports.appointmentTransitionStatusSchema = zod_1.default.enum([
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
]);
exports.getAvailableSlotsSchema = {
    query: zod_1.default.object({
        shopSlug: zod_1.default.string().trim().min(1),
        date: common_validate_1.dateOnlySchema,
        serviceIds: zod_1.default.array(common_validate_1.objectIdSchema).min(1),
        staffId: common_validate_1.objectIdSchema.optional(),
    }),
};
const createAppointmentBodySchema = zod_1.default.object({
    date: common_validate_1.dateOnlySchema,
    customerId: common_validate_1.objectIdSchema.optional(),
    startTime: zod_1.default
        .string()
        .regex(/^\d{2}:\d{2}$/, "startTime must use HH:mm format"),
    staffId: common_validate_1.objectIdSchema.optional(),
    serviceIds: zod_1.default.array(common_validate_1.objectIdSchema).optional(),
    serviceOptions: zod_1.default
        .array(zod_1.default.object({
        serviceId: common_validate_1.objectIdSchema,
        optionValueIds: zod_1.default.array(common_validate_1.objectIdSchema),
    }))
        .optional(),
    packageIds: zod_1.default.array(common_validate_1.objectIdSchema).optional(),
    addonIds: zod_1.default.array(common_validate_1.objectIdSchema).optional(),
    note: zod_1.default.string().max(500).optional(),
    source: zod_1.default.enum(["APP", "WALK_IN", "PHONE", "ZALO", "WEBSITE"]).optional(),
    promotionId: common_validate_1.objectIdSchema.optional(),
});
const requireAppointmentServiceSchema = (schema) => schema.refine((value) => {
    const data = value;
    return ((data.serviceIds?.length ?? 0) > 0 || (data.packageIds?.length ?? 0) > 0);
}, { message: "At least one service or package is required" });
exports.createAppointmentSchema = {
    body: requireAppointmentServiceSchema(createAppointmentBodySchema),
};
exports.createManagerAppointmentSchema = {
    body: requireAppointmentServiceSchema(createAppointmentBodySchema.extend({
        customerId: common_validate_1.objectIdSchema,
    })),
};
const appointmentStatusUpdateBodySchema = zod_1.default
    .object({
    status: exports.appointmentTransitionStatusSchema,
    staffId: common_validate_1.objectIdSchema.optional(),
    cancelReason: zod_1.default.string().trim().max(500).optional(),
    reason: zod_1.default.string().trim().max(500).optional(),
    internalNote: zod_1.default.string().max(500).optional(),
})
    .refine((d) => d.status !== "CANCELLED" || !!d.cancelReason || !!d.reason, {
    message: "Cancellation reason is required",
    path: ["cancelReason"],
});
exports.updateAppointmentStatusSchema = {
    body: appointmentStatusUpdateBodySchema,
};
exports.getAppointmentsSchema = {
    query: zod_1.default.object({
        shopId: common_validate_1.objectIdSchema.optional(),
        date: common_validate_1.dateOnlySchema.optional(),
        status: exports.appointmentStatusSchema.optional(),
        staffId: common_validate_1.objectIdSchema.optional(),
        assignedToMe: zod_1.default.enum(["true", "false"]).optional(),
        page: zod_1.default.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.default.coerce.number().int().min(1).max(100).default(20).optional(),
    }),
};
exports.getAppointmentsByDaySchema = {
    query: zod_1.default.object({
        date: common_validate_1.dateOnlySchema,
        assignedToMe: zod_1.default.enum(["true", "false"]).optional(),
    }),
};
exports.changeAppointmentStatusSchema = {
    body: appointmentStatusUpdateBodySchema,
};
