"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessHoursSchema = exports.updateShopSchema = exports.createShopSchema = void 0;
const zod_1 = require("zod");
const shopBaseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Shop name must be at least 2 characters").max(100),
    slug: zod_1.z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9-]+$/, "Slug may contain only lowercase letters, numbers, and hyphens"),
    type: zod_1.z.enum(["NAIL", "SPA", "HAIR", "COMBO"]).default("NAIL"),
    phone: zod_1.z.string().regex(/^(0|\+84)[0-9]{9}$/, "Invalid phone number").optional(),
    email: zod_1.z.string().email("Invalid email address").optional(),
    address: zod_1.z.string().max(200).optional(),
    city: zod_1.z.string().max(100).optional(),
    district: zod_1.z.string().max(100).optional(),
    logoUrl: zod_1.z.string().url("Invalid URL").optional(),
    coverUrl: zod_1.z.string().url("Invalid URL").optional(),
    description: zod_1.z.string().max(1000).optional(),
    openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid opening time (HH:mm)").default("08:00"),
    closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid closing time (HH:mm)").default("20:00"),
    workDays: zod_1.z.array(zod_1.z.coerce.number().int().min(1).max(7)).min(1, "At least one business day is required").default([1, 2, 3, 4, 5, 6]),
    timezone: zod_1.z.string().default("Asia/Ho_Chi_Minh"),
    settings: zod_1.z.object({
        autoConfirm: zod_1.z.boolean().default(false),
        autoConfirmMinutes: zod_1.z.number().int().min(0).default(30),
        reminderH24: zod_1.z.boolean().default(true),
        reminderH2: zod_1.z.boolean().default(true),
        reviewRequestMinutes: zod_1.z.number().int().min(0).default(30),
        depositRequired: zod_1.z.boolean().default(false),
        depositPercent: zod_1.z.number().min(0).max(100).default(30),
        maxAdvanceBookingDays: zod_1.z.number().int().min(1).max(365).default(30),
        slotIntervalMinutes: zod_1.z.number().int().min(5).max(60).default(15),
        attendanceGraceMinutes: zod_1.z.number().int().min(0).max(120).default(5),
        earlyCheckInMinutes: zod_1.z.number().int().min(0).max(240).default(30),
        lateCheckOutMinutes: zod_1.z.number().int().min(0).max(240).default(30),
    }).optional(),
});
exports.createShopSchema = shopBaseSchema.refine((data) => data.openTime < data.closeTime, { message: "Opening time must be before closing time", path: ["closeTime"] });
exports.updateShopSchema = shopBaseSchema
    .omit({ slug: true })
    .partial()
    .refine((data) => !data.openTime || !data.closeTime || data.openTime < data.closeTime, { message: "Opening time must be before closing time", path: ["closeTime"] });
const businessHourItemSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.coerce.number().int().min(0).max(6),
    openTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid opening time (HH:mm)"),
    closeTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid closing time (HH:mm)"),
    isClosed: zod_1.z.boolean().default(false),
}).refine((data) => data.isClosed || data.openTime < data.closeTime, {
    message: "Opening time must be before closing time",
    path: ["closeTime"],
});
exports.businessHoursSchema = zod_1.z
    .array(businessHourItemSchema)
    .min(1, "At least one day is required")
    .max(7, "A week can have at most 7 days")
    .refine((days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length, {
    message: "Each weekday may only be declared once",
});
