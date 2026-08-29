import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { Router } from "express";
import {
  inviteStaffController,
  acceptInviteController,
  updateStaffInfoController,
  updateStaffScheduleController,
  getStaffListByShopController,
  getStaffScheduleController,
} from "@/controller/staff/staff.controller";
import {
  inviteStaffSchema,
  updatedStaffInfo,
  updateStaffSchedule,
} from "@/validation/staff.validate";
import { validate } from "@/middleware/validation.middleware";
import offDayrouter from "./offDay.route";
const staffRouter = Router({ mergeParams: true });
staffRouter.use(authenticate);
staffRouter.get("/:staffId/schedule", requireShopAccess("STAFF"), getStaffScheduleController);
staffRouter.get("/", requireShopAccess("STAFF"), getStaffListByShopController);
staffRouter.post(
  "/invite",
  requireShopAccess("MANAGER"),
  validate({ body: inviteStaffSchema }),
  inviteStaffController,
);
staffRouter.post("/invite/accept", acceptInviteController);
staffRouter.patch(
  "/:staffId/info",
  requireShopAccess("MANAGER"),
  validate({ body: updatedStaffInfo }),
  updateStaffInfoController,
);
staffRouter.put(
  "/:staffId/schedule",
  requireShopAccess("MANAGER"),
  validate({ body: updateStaffSchedule }),
  updateStaffScheduleController,
);
staffRouter.use(offDayrouter);
export default staffRouter;
