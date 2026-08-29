"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseOffDaySchema = exports.requestOffDaySchema = exports.updateStaffSchedule = exports.updatedStaffInfo = exports.inviteStaffSchema = void 0;
const zod_1 = require("zod");
exports.inviteStaffSchema = zod_1.z.object({
    invitedEmail: zod_1.z.string().email("Email không hợp lệ"),
    // Owners are created with the shop and are not invited through this form.
    role: zod_1.z.enum(["MANAGER", "STAFF"]).default("STAFF"),
});
exports.updatedStaffInfo = zod_1.z
    .object({
    role: zod_1.z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
    isActive: zod_1.z.boolean().optional(),
})
    .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: "Cần ít nhất một trường để cập nhật",
});
exports.updateStaffSchedule = zod_1.z.array(zod_1.z.object({
    dayOfWeek: zod_1.z.number().int().min(0).max(6),
    startTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ mở cửa không hợp lệ (HH:mm)"),
    endTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ đóng cửa không hợp lệ (HH:mm)"),
    isOff: zod_1.z.boolean().default(false),
}));
exports.requestOffDaySchema = zod_1.z
    .object({
    offDate: zod_1.z.coerce.date(),
    offDateEnd: zod_1.z.coerce.date().optional(),
    reason: zod_1.z.string().max(100).optional(),
})
    .refine((data) => {
    if (data.offDateEnd)
        return data.offDateEnd >= data.offDate;
    return true;
}, { message: "Ngày kết thúc phải sau ngày bắt đầu", path: ["offDateEnd"] })
    .refine((data) => data.offDate >= new Date(), {
    message: "Ngày xin nghỉ không hợp lệ",
    path: ["offDate"],
});
exports.responseOffDaySchema = zod_1.z
    .object({
    status: zod_1.z.enum(["APPROVED", "REJECTED"]),
    rejectReason: zod_1.z.string().max(100).optional(),
})
    .refine((data) => {
    if (data.status === "REJECTED")
        return !!data.rejectReason;
    return true;
}, { message: "Cần có lý do từ chối", path: ["rejectReason"] });
