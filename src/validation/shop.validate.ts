import { z } from "zod";

const shopBaseSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug may contain only lowercase letters, numbers, and hyphens"),
  type: z.enum(["NAIL", "SPA", "HAIR", "COMBO"]).default("NAIL"),
  phone: z.string().regex(/^(0|\+84)[0-9]{9}$/, "Invalid phone number").optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  logoUrl: z.string().url("Invalid URL").optional(),
  coverUrl: z.string().url("Invalid URL").optional(),
  description: z.string().max(1000).optional(),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid opening time (HH:mm)").default("08:00"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid closing time (HH:mm)").default("20:00"),
  workDays: z.array(z.coerce.number().int().min(1).max(7)).min(1, "At least one business day is required").default([1, 2, 3, 4, 5, 6]),
  timezone: z.string().default("Asia/Ho_Chi_Minh"),
  settings: z.object({
    autoConfirm: z.boolean().default(false),
    autoConfirmMinutes: z.number().int().min(0).default(30),
    reminderH24: z.boolean().default(true),
    reminderH2: z.boolean().default(true),
    reviewRequestMinutes: z.number().int().min(0).default(30),
    depositRequired: z.boolean().default(false),
    depositPercent: z.number().min(0).max(100).default(30),
    maxAdvanceBookingDays: z.number().int().min(1).max(365).default(30),
    slotIntervalMinutes: z.number().int().min(5).max(60).default(15),
    attendanceGraceMinutes: z.number().int().min(0).max(120).default(5),
    earlyCheckInMinutes: z.number().int().min(0).max(240).default(30),
    lateCheckOutMinutes: z.number().int().min(0).max(240).default(30),
  }).optional(),
});

export const createShopSchema = shopBaseSchema.refine(
  (data) => data.openTime < data.closeTime,
  { message: "Opening time must be before closing time", path: ["closeTime"] },
);

export const updateShopSchema = shopBaseSchema
  .omit({ slug: true })
  .partial()
  .refine(
    (data) => !data.openTime || !data.closeTime || data.openTime < data.closeTime,
    { message: "Opening time must be before closing time", path: ["closeTime"] },
  );

const businessHourItemSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid opening time (HH:mm)"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid closing time (HH:mm)"),
  isClosed: z.boolean().default(false),
}).refine((data) => data.isClosed || data.openTime < data.closeTime, {
  message: "Opening time must be before closing time",
  path: ["closeTime"],
});

export const businessHoursSchema = z
  .array(businessHourItemSchema)
  .min(1, "At least one day is required")
  .max(7, "A week can have at most 7 days")
  .refine((days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length, {
    message: "Each weekday may only be declared once",
  });

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
