"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessHoursSchema = exports.updateShopSchema = exports.createShopSchema = void 0;
// src/validation/shop.validate.ts
const zod_1 = require("zod");
const shopBaseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Tên shop tối thiểu 2 ký tự").max(100),
    slug: zod_1.z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
    type: zod_1.z.enum(["NAIL", "SPA", "HAIR", "COMBO"]).default("NAIL"),
    phone: zod_1.z
        .string()
        .regex(/^(0|\+84)[0-9]{9}$/, "Số điện thoại không hợp lệ")
        .optional(),
    email: zod_1.z.string().email("Email không hợp lệ").optional(),
    address: zod_1.z.string().max(200).optional(),
    city: zod_1.z.string().max(100).optional(),
    district: zod_1.z.string().max(100).optional(),
    logoUrl: zod_1.z.string().url("URL không hợp lệ").optional(),
    coverUrl: zod_1.z.string().url("URL không hợp lệ").optional(),
    description: zod_1.z.string().max(1000).optional(),
    openTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ mở cửa không hợp lệ (HH:mm)")
        .default("08:00"),
    closeTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ đóng cửa không hợp lệ (HH:mm)")
        .default("20:00"),
    workDays: zod_1.z
        .array(zod_1.z.coerce.number().int().min(1).max(7))
        .min(1, "Phải có ít nhất 1 ngày làm việc")
        .default([1, 2, 3, 4, 5, 6]),
    timezone: zod_1.z.string().default("Asia/Ho_Chi_Minh"),
    settings: zod_1.z
        .object({
        autoConfirm: zod_1.z.boolean().default(false),
        autoConfirmMinutes: zod_1.z.number().int().min(0).default(30),
        reminderH24: zod_1.z.boolean().default(true),
        reminderH2: zod_1.z.boolean().default(true),
        reviewRequestMinutes: zod_1.z.number().int().min(0).default(30),
        depositRequired: zod_1.z.boolean().default(false),
        depositPercent: zod_1.z.number().min(0).max(100).default(30),
        maxAdvanceBookingDays: zod_1.z.number().int().min(1).max(365).default(30),
        slotIntervalMinutes: zod_1.z.number().int().min(5).max(60).default(15),
    })
        .optional(),
});
// ✅ createShop - refine sau khi đã có base
exports.createShopSchema = shopBaseSchema.refine((data) => data.openTime < data.closeTime, { message: "Giờ mở cửa phải trước giờ đóng cửa", path: ["closeTime"] });
// ✅ updateShop - partial trên base, refine riêng
exports.updateShopSchema = shopBaseSchema
    .omit({ slug: true })
    .partial()
    .refine((data) => {
    if (data.openTime && data.closeTime) {
        return data.openTime < data.closeTime;
    }
    return true; // nếu không gửi cả 2 thì không cần check
}, { message: "Giờ mở cửa phải trước giờ đóng cửa", path: ["closeTime"] });
// ✅ business hours - lịch làm việc theo từng ngày trong tuần (0 = Chủ nhật ... 6 = Thứ 7)
const businessHourItemSchema = zod_1.z
    .object({
    dayOfWeek: zod_1.z.coerce.number().int().min(0).max(6),
    openTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ mở cửa không hợp lệ (HH:mm)"),
    closeTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ đóng cửa không hợp lệ (HH:mm)"),
    isClosed: zod_1.z.boolean().default(false),
})
    .refine((data) => data.isClosed || data.openTime < data.closeTime, {
    message: "Giờ mở cửa phải trước giờ đóng cửa",
    path: ["closeTime"],
});
exports.businessHoursSchema = zod_1.z
    .array(businessHourItemSchema)
    .min(1, "Phải có ít nhất 1 ngày")
    .max(7, "Tối đa 7 ngày trong tuần")
    .refine((days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length, { message: "Mỗi ngày trong tuần chỉ được khai báo 1 lần" });
