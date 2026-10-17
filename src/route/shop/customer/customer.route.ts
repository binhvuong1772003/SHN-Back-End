import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { validate } from "@/middleware/validation.middleware";
import { getCustomerDetailController, getCustomerListController, getTopCustomerController } from "@/controller/customer/customer.controller";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { customerListQuerySchema, idParamSchema, topCustomerQuerySchema } from "@/validation/common.validate";
const customerRouter = Router({ mergeParams: true });
customerRouter.use(authenticate, requireShopAccess("STAFF"));

customerRouter.get("/top", validate({ query: topCustomerQuerySchema }), getTopCustomerController);
customerRouter.get("/", requireShopAccess("MANAGER"), validate({ query: customerListQuerySchema }), getCustomerListController);
customerRouter.get("/:customerId", requireShopAccess("MANAGER"), validate({ params: idParamSchema("customerId") }), getCustomerDetailController);
export default customerRouter;
