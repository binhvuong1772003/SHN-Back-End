import z from 'zod';
import { dateOnlySchema, objectIdSchema } from '@/validation/common.validate';

export const appointmentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const appointmentTransitionStatusSchema = z.enum([
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const getAvailableSlotsSchema = {
  query: z.object({
    shopSlug: z.string().trim().min(1),
    date: dateOnlySchema,
    serviceIds: z.array(objectIdSchema).min(1),
    staffId: objectIdSchema.optional(),
  }),
};

export const createAppointmentSchema = {
  body: z
    .object({
      date: dateOnlySchema,
      startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'startTime must use HH:mm format'),
      staffId: objectIdSchema.optional(),
      serviceIds: z.array(objectIdSchema).optional(),
      serviceOptions: z
        .array(
          z.object({
            serviceId: objectIdSchema,
            optionValueIds: z.array(objectIdSchema),
          })
        )
        .optional(),
      packageIds: z.array(objectIdSchema).optional(),
      addonIds: z.array(objectIdSchema).optional(),
      note: z.string().max(500).optional(),
      source: z.enum(['APP', 'WALK_IN', 'PHONE', 'ZALO', 'WEBSITE']).optional(),
      promotionId: objectIdSchema.optional(),
    })
    .refine(
      (d) => (d.serviceIds?.length ?? 0) > 0 || (d.packageIds?.length ?? 0) > 0,
      { message: 'At least one service or package is required' }
    ),
};

const appointmentStatusUpdateBodySchema = z
  .object({
    status: appointmentTransitionStatusSchema,
    staffId: objectIdSchema.optional(),
    cancelReason: z.string().trim().max(500).optional(),
    reason: z.string().trim().max(500).optional(),
    internalNote: z.string().max(500).optional(),
  })
  .refine((d) => d.status !== 'CANCELLED' || !!d.cancelReason || !!d.reason, {
    message: 'Cancellation reason is required',
    path: ['cancelReason'],
  });

export const updateAppointmentStatusSchema = {
  body: appointmentStatusUpdateBodySchema,
};

export const getAppointmentsSchema = {
  query: z.object({
    shopId: objectIdSchema.optional(),
    date: dateOnlySchema.optional(),
    status: appointmentStatusSchema.optional(),
    staffId: objectIdSchema.optional(),
    assignedToMe: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
};
export const getAppointmentsByDaySchema = {
  query: z.object({
    date: dateOnlySchema,
    assignedToMe: z.enum(['true', 'false']).optional(),
  }),
};
export const changeAppointmentStatusSchema = {
  body: appointmentStatusUpdateBodySchema,
};
export type GetAvailableSlotsInput = z.infer<
  typeof getAvailableSlotsSchema.query
>;
export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema.body
>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema.body
>;
export type GetAppointmentsInput = z.infer<typeof getAppointmentsSchema.query>;
