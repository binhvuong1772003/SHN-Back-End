import { z } from "zod";
import { dateOnlySchema } from "@/validation/common.validate";

export const financialReportQuerySchema = z
  .object({
    periodStart: dateOnlySchema,
    periodEnd: dateOnlySchema,
  })
  .refine((value) => value.periodStart <= value.periodEnd, {
    message: "Start date must be before or equal to end date",
    path: ["periodEnd"],
  });

export type FinancialReportQuery = z.infer<typeof financialReportQuerySchema>;
