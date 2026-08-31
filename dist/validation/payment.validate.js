"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaymentSchema = exports.createPaymentSchema = exports.paymentParamsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const common_validate_1 = require("../validation/common.validate");
const paymentMethodSchema = zod_1.default.enum([
    "CASH",
    "MOMO",
    "VNPAY",
    "ZALO_PAY",
    "CARD",
    "TRANSFER",
]);
exports.paymentParamsSchema = {
    params: zod_1.default.object({
        appointmentId: common_validate_1.objectIdSchema,
    }),
};
exports.createPaymentSchema = {
    body: zod_1.default.object({
        method: paymentMethodSchema.default("CASH"),
        note: zod_1.default.string().trim().max(500).optional(),
    }),
};
exports.confirmPaymentSchema = {
    body: zod_1.default.object({
        paidAmount: zod_1.default.coerce.number().finite().min(0),
        transactionId: zod_1.default.string().trim().max(200).optional(),
        note: zod_1.default.string().trim().max(500).optional(),
    }),
};
