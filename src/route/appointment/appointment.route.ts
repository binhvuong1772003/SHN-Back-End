import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { validate } from "@/middleware/validation.middleware";
import { createAppointmentSchema } from "@/validation/appointment";
import { requireShopAccess } from "@/middleware/shop.middleware";
import {
  createAppointmentController,
  getAppointmentsByShopIdController,
  getAppointmentsByDayController,
  changeAppointmentStatusController,
  getIncomeByDayWeeklyController,
  markAllAppointmentsAsDoneController,
} from "@/controller/appointment/appointment.controller";

const appointmentRouter = Router({ mergeParams: true });

appointmentRouter.use(authenticate);
appointmentRouter.use(requireShopAccess("STAFF"));

appointmentRouter.post(
  "/",
  validate(createAppointmentSchema),
  createAppointmentController,
);
appointmentRouter.get("/", getAppointmentsByShopIdController);
appointmentRouter.get("/day", getAppointmentsByDayController);
appointmentRouter.put("/:appointmentId", changeAppointmentStatusController);
appointmentRouter.get("/income/weekly", getIncomeByDayWeeklyController);
appointmentRouter.put("/all/done", markAllAppointmentsAsDoneController);
export default appointmentRouter;
