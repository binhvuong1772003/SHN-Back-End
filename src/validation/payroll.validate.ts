import { z } from "zod";
import { dateOnlySchema, objectIdSchema, paginationSchema } from "@/validation/common.validate";

const dateSchema = dateOnlySchema;

export const salaryConfigSchema = z
  .object({
    commissionType: z
      .enum(["PERCENT", "FIXED_PER_SERVICE", "FIXED_PER_DAY", "SALARY"])
      .optional(),
    baseSalary: z.number().min(0).optional(),
    salaryPeriod: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
    defaultCommissionPercent: z.number().min(0).max(100).optional(),
    defaultFixedPerService: z.number().min(0).optional(),
    bonusPerPositiveReview: z.number().min(0).optional(),
    penaltyPerNoShow: z.number().min(0).optional(),
    penaltyPerLateMinute: z.number().min(0).optional(),
    otMultiplier: z.number().min(0).optional(),
    effectiveFrom: z.coerce.date().optional(),
    note: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one salary configuration field is required",
  });

export const serviceCommissionSchema = z.object({
  commissionType: z.enum(["PERCENT", "FIXED_PER_SERVICE"]),
  value: z.number().min(0),
});

export const generatePayrollSchema = z
  .object({
    periodStart: dateSchema,
    periodEnd: dateSchema,
    staffIds: z.array(objectIdSchema).min(1).optional(),
  })
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: "Start date must be before or equal to end date",
    path: ["periodEnd"],
  });

export const payrollListQuerySchema = z
  .object({
    periodStart: dateSchema.optional(),
    periodEnd: dateSchema.optional(),
    status: z.enum(["DRAFT", "CONFIRMED", "PAID"]).optional(),
    staffId: objectIdSchema.optional(),
  }).merge(paginationSchema)
  .refine(
    (data) =>
      !data.periodStart ||
      !data.periodEnd ||
      data.periodStart <= data.periodEnd,
    {
      message: "Start date must be before or equal to end date",
      path: ["periodEnd"],
    },
  );

export const payrollAdjustmentSchema = z.object({
  type: z.enum(["BONUS", "DEDUCTION"]),
  amount: z.number().positive(),
  description: z.string().trim().min(3).max(500),
});

export const payPayrollSchema = z.object({
  paymentMethod: z.enum([
    "CASH",
    "MOMO",
    "VNPAY",
    "ZALO_PAY",
    "CARD",
    "TRANSFER",
  ]),
  paymentNote: z.string().max(500).optional(),
});

export type SalaryConfigInput = z.infer<typeof salaryConfigSchema>;
export type ServiceCommissionInput = z.infer<typeof serviceCommissionSchema>;
export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
export type PayrollAdjustmentInput = z.infer<typeof payrollAdjustmentSchema>;
export type PayPayrollInput = z.infer<typeof payPayrollSchema>;
