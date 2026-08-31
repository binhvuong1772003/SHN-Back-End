import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import { requirePayrollAdjustmentPermission } from "@/middleware/payroll.middleware";
import { idParamSchema } from "@/validation/common.validate";
import {
  generatePayrollSchema,
  payPayrollSchema,
  payrollAdjustmentSchema,
  payrollListQuerySchema,
} from "@/validation/payroll.validate";
import {
  adjustDraftPayrollController,
  confirmPayrollController,
  generateDraftPayrollsController,
  getMyPayrollDetailController,
  getMyPayrollsController,
  getPayrollDetailController,
  getPayrollListController,
  payPayrollController,
} from "@/controller/payroll/payroll.controller";

const payrollRouter = Router({ mergeParams: true });
payrollRouter.use(authenticate);

payrollRouter.post(
  "/generate",
  requireShopAccess("MANAGER"),
  validate({ body: generatePayrollSchema }),
  generateDraftPayrollsController,
);
payrollRouter.get(
  "/me",
  requireShopAccess("STAFF"),
  getMyPayrollsController,
);
payrollRouter.get(
  "/me/:payrollId",
  requireShopAccess("STAFF"),
  validate({ params: idParamSchema("payrollId") }),
  getMyPayrollDetailController,
);
payrollRouter.get(
  "/",
  requireShopAccess("MANAGER"),
  validate({ query: payrollListQuerySchema }),
  getPayrollListController,
);
payrollRouter.get(
  "/:payrollId",
  requireShopAccess("MANAGER"),
  validate({ params: idParamSchema("payrollId") }),
  getPayrollDetailController,
);
payrollRouter.patch(
  "/:payrollId/adjustments",
  requireShopAccess("MANAGER"),
  requirePayrollAdjustmentPermission,
  validate({ params: idParamSchema("payrollId"), body: payrollAdjustmentSchema }),
  adjustDraftPayrollController,
);
payrollRouter.post(
  "/:payrollId/confirm",
  requireShopAccess("OWNER"),
  validate({ params: idParamSchema("payrollId") }),
  confirmPayrollController,
);
payrollRouter.post(
  "/:payrollId/pay",
  requireShopAccess("OWNER"),
  validate({ params: idParamSchema("payrollId"), body: payPayrollSchema }),
  payPayrollController,
);

export default payrollRouter;
