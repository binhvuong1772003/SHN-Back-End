import { z } from "zod";
import { dateOnlySchema, dateRangeSchema, objectIdSchema, paginationSchema } from "@/validation/common.validate";

export const attendanceQrSchema = z.object({
  qrToken: z.string().trim().min(1, "QR token is required"),
});

export const manualAttendanceSchema = z.object({
  staffId: objectIdSchema,
  action: z.enum(["CHECK_IN", "CHECK_OUT"]),
  reason: z.string().trim().min(3).max(500),
});

export const myAttendanceHistorySchema = dateRangeSchema.merge(paginationSchema);

export const shopAttendanceQuerySchema = myAttendanceHistorySchema.merge(z.object({
  date: dateOnlySchema.optional(),
  staffId: objectIdSchema.optional(),
}));

export const adjustAttendanceSchema = z.object({
  checkIn: z.coerce.date().optional().nullable(),
  checkOut: z.coerce.date().optional().nullable(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "DAY_OFF_APPROVED"]).optional(),
  note: z.string().max(500).optional().nullable(),
  reason: z.string().trim().min(3).max(500),
}).refine(
  (data) => data.checkIn !== undefined || data.checkOut !== undefined || data.status !== undefined || data.note !== undefined,
  { message: "At least one attendance field is required for update" },
);

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
export type AdjustAttendanceInput = z.infer<typeof adjustAttendanceSchema>;
