import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { validate } from "@/middleware/validation.middleware";
import { getTopCustomerController } from "@/controller/customer/customer.controller";
import { requireShopAccess } from "@/middleware/shop.middleware";
import { topCustomerQuerySchema } from "@/validation/common.validate";
const customerRouter = Router({ mergeParams: true });
customerRouter.use(authenticate, requireShopAccess("STAFF"));

customerRouter.get("/top", validate({ query: topCustomerQuerySchema }), getTopCustomerController);
export default customerRouter;
