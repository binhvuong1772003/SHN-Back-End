import { z } from "zod";

export const inviteStaffSchema = z.object({
  invitedEmail: z.string().email("Invalid email address"),
  // Owners are created with the shop and are not invited through this form.
  role: z.enum(["MANAGER", "STAFF"]).default("STAFF"),
});

export const updatedStaffInfo = z
  .object({
    role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
    permissions: z.array(z.enum(["PAYROLL_ADJUST"])).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.permissions !== undefined ||
      data.isActive !== undefined,
    {
    message: "At least one field is required",
    },
  );

export const updateStaffSchedule = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid opening time (HH:mm)"),
    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Invalid closing time (HH:mm)",
      ),
    isOff: z.boolean().default(false),
  }),
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
    { message: "End date must be after start date", path: ["offDateEnd"] },
  )
  .refine((data) => data.offDate >= new Date(), {
    message: "Invalid off-day date",
    path: ["offDate"],
  });

export const responseOffDaySchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectReason: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.status === "REJECTED") return !!data.rejectReason;
      return true;
    },
    { message: "A rejection reason is required", path: ["rejectReason"] },
  );

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdatedStaffInfo = z.infer<typeof updatedStaffInfo>;
export type UpdateStaffSchedule = z.infer<typeof updateStaffSchedule>;
export type RequestOffDayInput = z.infer<typeof requestOffDaySchema>;
export type ResponseOffDayInput = z.infer<typeof responseOffDaySchema>;
