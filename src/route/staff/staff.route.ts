import { Router } from "express";
import { z } from "zod";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import { idParamSchema, objectIdSchema, staffListQuerySchema } from "@/validation/common.validate";
import {
  inviteStaffController,
  acceptInviteController,
  updateStaffInfoController,
  updateStaffScheduleController,
  getStaffListByShopController,
  getStaffScheduleController,
  getStaffDetailController,
  deleteStaffScheduleController,
} from "@/controller/staff/staff.controller";
import { inviteStaffSchema, updatedStaffInfo, updateStaffSchedule } from "@/validation/staff.validate";
import offDayrouter from "./offDay.route";
import {
  getSalaryConfigController,
  getServiceCommissionsController,
  upsertSalaryConfigController,
  upsertServiceCommissionController,
} from "@/controller/payroll/payroll.controller";
import { salaryConfigSchema, serviceCommissionSchema } from "@/validation/payroll.validate";

const staffRouter = Router({ mergeParams: true });
staffRouter.use(authenticate);

staffRouter.get("/:staffId/salary-config", requireShopAccess("OWNER"), validate({ params: idParamSchema("staffId") }), getSalaryConfigController);
staffRouter.put("/:staffId/salary-config", requireShopAccess("OWNER"), validate({ params: idParamSchema("staffId"), body: salaryConfigSchema }), upsertSalaryConfigController);
staffRouter.get("/:staffId/commissions", requireShopAccess("OWNER"), validate({ params: idParamSchema("staffId") }), getServiceCommissionsController);
staffRouter.put(
  "/:staffId/commissions/:serviceId",
  requireShopAccess("OWNER"),
  validate({ params: z.object({ staffId: objectIdSchema, serviceId: objectIdSchema }), body: serviceCommissionSchema }),
  upsertServiceCommissionController,
);
staffRouter.get("/:staffId/schedule", requireShopAccess("STAFF"), validate({ params: idParamSchema("staffId") }), getStaffScheduleController);
staffRouter.get("/:staffId/info", requireShopAccess("MANAGER"), validate({ params: idParamSchema("staffId") }), getStaffDetailController);
staffRouter.get("/", requireShopAccess("STAFF"), validate({ query: staffListQuerySchema }), getStaffListByShopController);
staffRouter.post("/invite", requireShopAccess("MANAGER"), validate({ body: inviteStaffSchema }), inviteStaffController);
staffRouter.post("/invite/accept", acceptInviteController);
staffRouter.patch("/:staffId/info", requireShopAccess("MANAGER"), validate({ params: idParamSchema("staffId"), body: updatedStaffInfo }), updateStaffInfoController);
staffRouter.put("/:staffId/schedule", requireShopAccess("MANAGER"), validate({ params: idParamSchema("staffId"), body: updateStaffSchedule }), updateStaffScheduleController);
staffRouter.delete("/:staffId/schedule", requireShopAccess("MANAGER"), validate({ params: idParamSchema("staffId") }), deleteStaffScheduleController);
staffRouter.use(offDayrouter);

export default staffRouter;
