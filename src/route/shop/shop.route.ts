import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { Router } from "express";
import { validate } from "@/middleware/validation.middleware";
import {
  createShopSchema,
  updateShopSchema,
  businessHoursSchema,
} from "@/validation/shop.validate";
import {
  createShopController,
  getShopDetailController,
  uploadShopLogoController,
  updateShopController,
  getListShopController,
  uploadShopBannerController,
  getBusinessHoursController,
  updateBusinessHoursController,
} from "@/controller/shop/shop.controller";
import { upload } from "@/middleware/upload.middleware";
import staffRouter from "../staff/staff.route";
import attendanceRouter from "../staff/attendance.route";
import serviceRouter from "../service/service.route";
import notiRouter from "../notification/notification.route";
import calendarRouter from "../calendar/calendar.route";
import appointmentRouter from "../appointment/appointment.route";
import customerRouter from "./customer/customer.route";
import { getCurrentShopMembershipController } from "@/controller/shop/membership.controller";
import payrollRouter from "../payroll/payroll.route";
import financialReportRouter from "../financial-report/financial-report.route";
import paymentRouter from "../payment/payment.route";

const shopRouter = Router();
shopRouter.use(authenticate);
shopRouter.post(
  "/",
  validate({ body: createShopSchema }),
  createShopController,
);
shopRouter.get("/", getListShopController);
shopRouter.get("/:shopSlug/members/me", getCurrentShopMembershipController);
shopRouter.get("/:shopSlug", requireShopAccess(), getShopDetailController);
shopRouter.patch(
  "/:shopSlug",
  requireShopAccess("OWNER"),
  validate({ body: updateShopSchema }),
  updateShopController,
);
shopRouter.patch(
  "/:shopSlug/logo",
  requireShopAccess("OWNER"),
  upload.single("logo"),
  uploadShopLogoController,
);
shopRouter.patch(
  "/:shopSlug/banner",
  requireShopAccess("OWNER"),
  upload.single("banner"),
  uploadShopBannerController,
);
shopRouter.get(
  "/:shopSlug/business-hours",
  requireShopAccess(),
  getBusinessHoursController,
);
shopRouter.patch(
  "/:shopSlug/business-hours",
  requireShopAccess("OWNER"),
  validate({ body: businessHoursSchema }),
  updateBusinessHoursController,
);
shopRouter.use("/:shopSlug/staff", staffRouter);
shopRouter.use("/:shopSlug/attendance", attendanceRouter);
shopRouter.use("/:shopSlug/services", serviceRouter);
shopRouter.use("/:shopSlug/notifications", notiRouter);
shopRouter.use("/:shopSlug/calendar", calendarRouter);
shopRouter.use("/:shopSlug/appointments", appointmentRouter);
shopRouter.use("/:shopSlug/customers", customerRouter);
shopRouter.use("/:shopSlug/payrolls", payrollRouter);
shopRouter.use("/:shopSlug/financial-report", financialReportRouter);
shopRouter.use("/:shopSlug/payments", paymentRouter);

export default shopRouter;
