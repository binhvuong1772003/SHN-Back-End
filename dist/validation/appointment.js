"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeAppointmentStatusSchema = exports.getAppointmentsSchema = exports.updateAppointmentStatusSchema = exports.createAppointmentSchema = exports.getAvailableSlotsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.getAvailableSlotsSchema = {
    query: zod_1.default.object({
        shopId: zod_1.default.string(),
        date: zod_1.default
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải có định dạng YYYY-MM-DD'),
        durationMin: zod_1.default.coerce.number().int().min(15),
        staffId: zod_1.default.string().optional(),
    }),
};
exports.createAppointmentSchema = {
    body: zod_1.default
        .object({
        date: zod_1.default
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải có định dạng YYYY-MM-DD'),
        startTime: zod_1.default
            .string()
            .regex(/^\d{2}:\d{2}$/, 'startTime phải có định dạng HH:mm'),
        staffId: zod_1.default.string().optional(),
        serviceIds: zod_1.default.array(zod_1.default.string()).optional(),
        serviceOptions: zod_1.default
            .array(zod_1.default.object({
            serviceId: zod_1.default.string(),
            optionValueIds: zod_1.default.array(zod_1.default.string()),
        }))
            .optional(),
        packageIds: zod_1.default.array(zod_1.default.string()).optional(),
        addonIds: zod_1.default.array(zod_1.default.string()).optional(),
        note: zod_1.default.string().max(500).optional(),
        source: zod_1.default.enum(['APP', 'WALK_IN', 'PHONE', 'ZALO', 'WEBSITE']).optional(),
        promotionId: zod_1.default.string().optional(),
    })
        .refine((d) => (d.serviceIds?.length ?? 0) > 0 || (d.packageIds?.length ?? 0) > 0, { message: 'Phải chọn ít nhất 1 service hoặc package' }),
};
exports.updateAppointmentStatusSchema = {
    body: zod_1.default
        .object({
        status: zod_1.default.enum([
            'CONFIRMED',
            'IN_PROGRESS',
            'DONE',
            'CANCELLED',
            'NO_SHOW',
        ]),
        staffId: zod_1.default.string().optional(),
        cancelReason: zod_1.default.string().optional(),
        internalNote: zod_1.default.string().max(500).optional(),
    })
        .refine((d) => d.status !== 'CANCELLED' || !!d.cancelReason, {
        message: 'Vui lòng nhập lý do hủy',
        path: ['cancelReason'],
    }),
};
exports.getAppointmentsSchema = {
    query: zod_1.default.object({
        shopId: zod_1.default.string().optional(),
        date: zod_1.default
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        status: zod_1.default
            .enum([
            'PENDING',
            'CONFIRMED',
            'IN_PROGRESS',
            'DONE',
            'CANCELLED',
            'NO_SHOW',
        ])
            .optional(),
        staffId: zod_1.default.string().optional(),
        page: zod_1.default.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.default.coerce.number().int().min(1).max(100).default(20).optional(),
    }),
};
exports.changeAppointmentStatusSchema = {
    body: zod_1.default.object({
        status: zod_1.default.enum([
            'CONFIRMED',
            'IN_PROGRESS',
            'DONE',
            'CANCELLED',
            'NO_SHOW',
        ]),
    }),
};
