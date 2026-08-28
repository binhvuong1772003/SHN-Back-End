import { Router } from "express";
import {
  getAvailableSlotsController,
  getAllSlotsController,
  getTimeSlotsController,
  getAppointmentsWithSlotsController,
  getMonthAvailabilityController,
} from "@/controller/calendar/calendar.controller";

const calendarRouter = Router({ mergeParams: true });

calendarRouter.get("/slots", getAvailableSlotsController);
calendarRouter.get("/all-slots", getAllSlotsController);
calendarRouter.get("/time-slots", getTimeSlotsController);
calendarRouter.get("/appointments", getAppointmentsWithSlotsController);
calendarRouter.get("/month", getMonthAvailabilityController);

export default calendarRouter;
