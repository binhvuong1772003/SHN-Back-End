import { z } from 'zod';

export const inviteStaffSchema = z.object({
  invitedEmail: z.string().email('Email không hợp lệ'),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).default('STAFF'),
});

export const updatedStaffInfo = z.object({
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).default('STAFF'),
  isActive: z.boolean().default(true),
});

export const updateStaffSchedule = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ mở cửa không hợp lệ (HH:mm)'),
    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'Giờ đóng cửa không hợp lệ (HH:mm)'
      ),
    isOff: z.boolean().default(false),
  })
);

export const requestOffDaySchema = z
  .object({
    offDate: z.coerce.date(),
    offDateEnd: z.coerce.date().optional(),
    reason: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.offDateEnd) return data.offDateEnd >= data.offDate;
      return true;
    },
    { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['offDateEnd'] }
  )
  .refine((data) => data.offDate >= new Date(), {
    message: 'Ngày xin nghỉ không hợp lệ',
    path: ['offDate'],
  });

export const responseOffDaySchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectReason: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'REJECTED') return !!data.rejectReason;
      return true;
    },
    { message: 'Cần có lý do từ chối', path: ['rejectReason'] }
  );

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdatedStaffInfo = z.infer<typeof updatedStaffInfo>;
export type UpdateStaffSchedule = z.infer<typeof updateStaffSchedule>;
export type RequestOffDayInput = z.infer<typeof requestOffDaySchema>;
export type ResponseOffDayInput = z.infer<typeof responseOffDaySchema>;
