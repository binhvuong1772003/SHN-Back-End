import z from "zod";
import { objectIdSchema } from "@/validation/common.validate";

const paymentMethodSchema = z.enum([
  "CASH",
  "MOMO",
  "VNPAY",
  "ZALO_PAY",
  "CARD",
  "TRANSFER",
]);

export const paymentParamsSchema = {
  params: z.object({
    appointmentId: objectIdSchema,
  }),
};

export const createPaymentSchema = {
  body: z.object({
    method: paymentMethodSchema.default("CASH"),
    note: z.string().trim().max(500).optional(),
  }),
};

export const confirmPaymentSchema = {
  body: z.object({
    paidAmount: z.coerce.number().finite().min(0),
    transactionId: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
  }),
};

export type CreatePaymentInput = z.infer<typeof createPaymentSchema.body>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema.body>;
