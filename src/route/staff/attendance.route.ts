import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import {
  adjustAttendanceSchema,
  attendanceQrSchema,
  manualAttendanceSchema,
  myAttendanceHistorySchema,
  shopAttendanceQuerySchema,
} from "@/validation/attendance.validate";
import { idParamSchema } from "@/validation/common.validate";
import {
  adjustAttendanceController,
  getCheckInQRController,
  getCheckOutQRController,
  getMyAttendanceHistoryController,
  getMyTodayAttendanceController,
  getShopAttendanceController,
  manualAttendanceController,
  qrCheckInController,
  qrCheckOutController,
} from "@/controller/staff/attendace.controller";

const attendanceRouter = Router({ mergeParams: true });
attendanceRouter.use(authenticate);

attendanceRouter.get(
  "/qr/check-in",
  requireShopAccess("MANAGER"),
  getCheckInQRController,
);
attendanceRouter.get(
  "/qr/check-out",
  requireShopAccess("MANAGER"),
  getCheckOutQRController,
);
attendanceRouter.post(
  "/check-in",
  requireShopAccess("STAFF"),
  validate({ body: attendanceQrSchema }),
  qrCheckInController,
);
attendanceRouter.post(
  "/check-out",
  requireShopAccess("STAFF"),
  validate({ body: attendanceQrSchema }),
  qrCheckOutController,
);
attendanceRouter.post(
  "/manual",
  requireShopAccess("MANAGER"),
  validate({ body: manualAttendanceSchema }),
  manualAttendanceController,
);
attendanceRouter.get(
  "/me/today",
  requireShopAccess("STAFF"),
  getMyTodayAttendanceController,
);
attendanceRouter.get(
  "/me",
  requireShopAccess("STAFF"),
  validate({ query: myAttendanceHistorySchema }),
  getMyAttendanceHistoryController,
);
attendanceRouter.get(
  "/",
  requireShopAccess("MANAGER"),
  validate({ query: shopAttendanceQuerySchema }),
  getShopAttendanceController,
);
attendanceRouter.patch(
  "/:attendanceId",
  requireShopAccess("MANAGER"),
  validate({ params: idParamSchema("attendanceId"), body: adjustAttendanceSchema }),
  adjustAttendanceController,
);

export default attendanceRouter;
