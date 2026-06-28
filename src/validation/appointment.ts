import z from 'zod';

export const getAvailableSlotsSchema = {
  query: z.object({
    shopId: z.string(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải có định dạng YYYY-MM-DD'),
    durationMin: z.coerce.number().int().min(15),
    staffId: z.string().optional(),
  }),
};

export const createAppointmentSchema = {
  body: z
    .object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải có định dạng YYYY-MM-DD'),
      startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'startTime phải có định dạng HH:mm'),
      staffId: z.string().optional(),
      serviceIds: z.array(z.string()).optional(),
      serviceOptions: z
        .array(
          z.object({
            serviceId: z.string(),
            optionValueIds: z.array(z.string()),
          })
        )
        .optional(),
      packageIds: z.array(z.string()).optional(),
      addonIds: z.array(z.string()).optional(),
      note: z.string().max(500).optional(),
      source: z.enum(['APP', 'WALK_IN', 'PHONE', 'ZALO', 'WEBSITE']).optional(),
      promotionId: z.string().optional(),
    })
    .refine(
      (d) => (d.serviceIds?.length ?? 0) > 0 || (d.packageIds?.length ?? 0) > 0,
      { message: 'Phải chọn ít nhất 1 service hoặc package' }
    ),
};

export const updateAppointmentStatusSchema = {
  body: z
    .object({
      status: z.enum([
        'CONFIRMED',
        'IN_PROGRESS',
        'DONE',
        'CANCELLED',
        'NO_SHOW',
      ]),
      staffId: z.string().optional(),
      cancelReason: z.string().optional(),
      internalNote: z.string().max(500).optional(),
    })
    .refine((d) => d.status !== 'CANCELLED' || !!d.cancelReason, {
      message: 'Vui lòng nhập lý do hủy',
      path: ['cancelReason'],
    }),
};

export const getAppointmentsSchema = {
  query: z.object({
    shopId: z.string().optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    status: z
      .enum([
        'PENDING',
        'CONFIRMED',
        'IN_PROGRESS',
        'DONE',
        'CANCELLED',
        'NO_SHOW',
      ])
      .optional(),
    staffId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
};
export const changeAppointmentStatusSchema = {
  body: z.object({
    status: z.enum([
      'CONFIRMED',
      'IN_PROGRESS',
      'DONE',
      'CANCELLED',
      'NO_SHOW',
    ]),
  }),
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
