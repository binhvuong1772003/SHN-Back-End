import type { NextFunction, Request, Response } from "express";
import {
  confirmPayment,
  createPayment,
  getPayment,
  getPaymentDetail,
  getPaymentList,
} from "@/service/payment/payment.service";
import type {
  ConfirmPaymentInput,
  CreatePaymentInput,
} from "@/validation/payment.validate";
import type { PaymentListQuery } from "@/validation/payment-management.validate";
import { sendSuccess } from "@/utils/apiResponse";

export const getPaymentListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getPaymentList(
      req.params.shopSlug as string,
      req.query as unknown as PaymentListQuery,
    );
    return sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getPaymentDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payment = await getPaymentDetail(
      req.params.shopSlug as string,
      req.params.paymentId as string,
    );
    return sendSuccess(res, payment);
  } catch (error) {
    next(error);
  }
};

export const createPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await createPayment(
      req.params.shopSlug as string,
      req.params.appointmentId as string,
      req.user?.userId as string,
      req.body as CreatePaymentInput,
    );
    sendSuccess(res, result.payment, {
      statusCode: result.created ? 201 : 200,
      message: result.created ? "Payment created successfully" : "Payment already exists",
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payment = await getPayment(
      req.params.shopSlug as string,
      req.params.appointmentId as string,
    );
    sendSuccess(res, payment);
  } catch (error) {
    next(error);
  }
};

export const confirmPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payment = await confirmPayment(
      req.params.shopSlug as string,
      req.params.appointmentId as string,
      req.user?.userId as string,
      req.shopStaff?.role,
      req.body as ConfirmPaymentInput,
    );
    sendSuccess(res, payment, { message: "Payment confirmed successfully" });
  } catch (error) {
    next(error);
  }
};
