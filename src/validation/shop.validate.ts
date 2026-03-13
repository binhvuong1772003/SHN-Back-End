// src/validation/shop.validate.ts
import { z } from 'zod';

const shopBaseSchema = z.object({
  name: z.string().min(2, 'Tên shop tối thiểu 2 ký tự').max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  type: z.enum(['NAIL', 'SPA', 'HAIR', 'COMBO']).default('NAIL'),
  phone: z
    .string()
    .regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  logoUrl: z.string().url('URL không hợp lệ').optional(),
  coverUrl: z.string().url('URL không hợp lệ').optional(),
  description: z.string().max(1000).optional(),
  openTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ mở cửa không hợp lệ (HH:mm)')
    .default('08:00'),
  closeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ đóng cửa không hợp lệ (HH:mm)')
    .default('20:00'),
  workDays: z
    .array(z.number().int().min(1).max(7))
    .min(1, 'Phải có ít nhất 1 ngày làm việc')
    .default([1, 2, 3, 4, 5, 6]),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  settings: z
    .object({
      autoConfirm: z.boolean().default(false),
      autoConfirmMinutes: z.number().int().min(0).default(30),
      reminderH24: z.boolean().default(true),
      reminderH2: z.boolean().default(true),
      reviewRequestMinutes: z.number().int().min(0).default(30),
      depositRequired: z.boolean().default(false),
      depositPercent: z.number().min(0).max(100).default(30),
      maxAdvanceBookingDays: z.number().int().min(1).max(365).default(30),
      slotIntervalMinutes: z.number().int().min(5).max(60).default(15),
    })
    .optional(),
});

// ✅ createShop - refine sau khi đã có base
export const createShopSchema = shopBaseSchema.refine(
  (data) => data.openTime < data.closeTime,
  { message: 'Giờ mở cửa phải trước giờ đóng cửa', path: ['closeTime'] }
);

// ✅ updateShop - partial trên base, refine riêng
export const updateShopSchema = shopBaseSchema
  .omit({ slug: true })
  .partial()
  .refine(
    (data) => {
      if (data.openTime && data.closeTime) {
        return data.openTime < data.closeTime;
      }
      return true; // nếu không gửi cả 2 thì không cần check
    },
    { message: 'Giờ mở cửa phải trước giờ đóng cửa', path: ['closeTime'] }
  );

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
