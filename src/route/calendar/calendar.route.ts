import { Router } from "express";
import { requireShopAccess } from "@/middleware/shop.middleware";
import {
  getAvailableSlotsController,
  getAllSlotsController,
  getTimeSlotsController,
  getAppointmentsWithSlotsController,
  getMonthAvailabilityController,
} from "@/controller/calendar/calendar.controller";

const calendarRouter = Router({ mergeParams: true });
calendarRouter.use(requireShopAccess("STAFF"));

calendarRouter.get("/slots", getAvailableSlotsController);
calendarRouter.get("/all-slots", getAllSlotsController);
calendarRouter.get("/time-slots", getTimeSlotsController);
calendarRouter.get("/appointments", getAppointmentsWithSlotsController);
calendarRouter.get("/month", getMonthAvailabilityController);

export default calendarRouter;
