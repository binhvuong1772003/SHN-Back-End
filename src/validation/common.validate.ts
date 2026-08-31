import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Invalid date");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "Start date must be before or equal to end date",
  path: ["to"],
});

export const idParamSchema = (key: string) => z.object({ [key]: objectIdSchema });

export const staffListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  sort: z.enum(["RECENT", "NAME_ASC", "NAME_DESC", "REVENUE"]).optional(),
});

export const notificationListQuerySchema = paginationSchema;
export const topCustomerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
});

export const calendarSlotsQuerySchema = z.object({
  date: dateOnlySchema,
  durationMin: z.coerce.number().int().min(15).max(1440),
  staffId: objectIdSchema.optional(),
});

export const calendarDateQuerySchema = z.object({
  date: dateOnlySchema,
});

export const calendarSlotsListQuerySchema = calendarDateQuerySchema.extend({
  durationMin: z.coerce.number().int().min(15).max(1440),
});

export const calendarMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  staffId: objectIdSchema.optional(),
});

export const offDayListQuerySchema = paginationSchema.extend({
  assignedToMe: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  staffId: objectIdSchema.optional(),
});
