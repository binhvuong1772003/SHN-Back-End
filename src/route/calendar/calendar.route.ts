import { Router } from "express";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import {
  calendarDateQuerySchema,
  calendarMonthQuerySchema,
  calendarSlotsQuerySchema,
  calendarSlotsListQuerySchema,
} from "@/validation/common.validate";
import {
  getAvailableSlotsController,
  getAllSlotsController,
  getTimeSlotsController,
  getAppointmentsWithSlotsController,
  getMonthAvailabilityController,
} from "@/controller/calendar/calendar.controller";

const calendarRouter = Router({ mergeParams: true });
calendarRouter.use(requireShopAccess("STAFF"));

calendarRouter.get("/slots", validate({ query: calendarSlotsQuerySchema }), getAvailableSlotsController);
calendarRouter.get("/all-slots", validate({ query: calendarSlotsListQuerySchema }), getAllSlotsController);
calendarRouter.get("/time-slots", validate({ query: calendarDateQuerySchema }), getTimeSlotsController);
calendarRouter.get("/appointments", validate({ query: calendarDateQuerySchema }), getAppointmentsWithSlotsController);
calendarRouter.get("/month", validate({ query: calendarMonthQuerySchema }), getMonthAvailabilityController);

export default calendarRouter;
