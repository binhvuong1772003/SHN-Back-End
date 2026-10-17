import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { validate } from "@/middleware/validation.middleware";
import { getFinancialReportController } from "@/controller/financial-report/financial-report.controller";
import { financialReportQuerySchema } from "@/validation/financial-report.validate";

const financialReportRouter = Router({ mergeParams: true });
financialReportRouter.use(authenticate);
financialReportRouter.get(
  "/",
  requireShopAccess("MANAGER"),
  validate({ query: financialReportQuerySchema }),
  getFinancialReportController,
);

export default financialReportRouter;
