import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { validate } from "@/middleware/validation.middleware";
import {
  createAppointmentSchema,
  getAppointmentsByDaySchema,
  getAppointmentsSchema,
  updateAppointmentStatusSchema,
} from "@/validation/appointment";
import { idParamSchema } from "@/validation/common.validate";
import { requireShopAccess } from "@/middleware/shop.middleware";
import {
  createAppointmentController,
  getAppointmentsByShopIdController,
  getAppointmentsByDayController,
  changeAppointmentStatusController,
  getAppointmentLifecycleController,
  getIncomeByDayWeeklyController,
  markAllAppointmentsAsDoneController,
} from "@/controller/appointment/appointment.controller";
import {
  confirmPaymentController,
  createPaymentController,
  getPaymentController,
} from "@/controller/payment/payment.controller";
import {
  confirmPaymentSchema,
  createPaymentSchema,
  paymentParamsSchema,
} from "@/validation/payment.validate";

const appointmentRouter = Router({ mergeParams: true });

appointmentRouter.use(authenticate);
appointmentRouter.use(requireShopAccess("STAFF"));

appointmentRouter.post(
  "/",
  validate(createAppointmentSchema),
  createAppointmentController,
);
appointmentRouter.get(
  "/",
  validate(getAppointmentsSchema),
  getAppointmentsByShopIdController,
);
appointmentRouter.get(
  "/day",
  validate(getAppointmentsByDaySchema),
  getAppointmentsByDayController,
);
appointmentRouter.put(
  "/:appointmentId",
  requireShopAccess("MANAGER"),
  validate({ params: idParamSchema("appointmentId"), body: updateAppointmentStatusSchema.body }),
  changeAppointmentStatusController,
);
appointmentRouter.get(
  "/:appointmentId/lifecycle",
  validate({ params: idParamSchema("appointmentId") }),
  getAppointmentLifecycleController,
);
appointmentRouter.post(
  "/:appointmentId/payment",
  validate({ params: paymentParamsSchema.params, body: createPaymentSchema.body }),
  createPaymentController,
);
appointmentRouter.get(
  "/:appointmentId/payment",
  validate({ params: paymentParamsSchema.params }),
  getPaymentController,
);
appointmentRouter.post(
  "/:appointmentId/payment/confirm",
  requireShopAccess("MANAGER"),
  validate({ params: paymentParamsSchema.params, body: confirmPaymentSchema.body }),
  confirmPaymentController,
);
appointmentRouter.get("/income/weekly", getIncomeByDayWeeklyController);
appointmentRouter.put("/all/done", requireShopAccess("MANAGER"), markAllAppointmentsAsDoneController);
export default appointmentRouter;
