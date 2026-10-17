import { z } from "zod";
import { dateOnlySchema, objectIdSchema } from "@/validation/common.validate";

export const paymentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    status: z.enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"]).optional(),
    method: z.enum(["CASH", "MOMO", "VNPAY", "ZALO_PAY", "CARD", "TRANSFER"]).optional(),
    search: z.string().trim().max(100).optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must be before or equal to end date",
    path: ["to"],
  });

export const paymentDetailParamsSchema = z.object({
  paymentId: objectIdSchema,
});

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
