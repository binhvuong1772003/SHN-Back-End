import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import {
  getPaymentDetailController,
  getPaymentListController,
} from "@/controller/payment/payment.controller";
import {
  paymentDetailParamsSchema,
  paymentListQuerySchema,
} from "@/validation/payment-management.validate";

const paymentRouter = Router({ mergeParams: true });
paymentRouter.use(authenticate);
paymentRouter.use(requireShopAccess("MANAGER"));

paymentRouter.get("/", validate({ query: paymentListQuerySchema }), getPaymentListController);
paymentRouter.get(
  "/:paymentId",
  validate({ params: paymentDetailParamsSchema }),
  getPaymentDetailController,
);

export default paymentRouter;
