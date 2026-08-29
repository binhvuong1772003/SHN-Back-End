import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { validate } from "@/middleware/validation.middleware";
import { getTopCustomerController } from "@/controller/customer/customer.controller";
import { requireShopAccess } from "@/middleware/shop.middleware";
const customerRouter = Router({ mergeParams: true });
customerRouter.use(authenticate, requireShopAccess("STAFF"));

customerRouter.get("/top", getTopCustomerController);
export default customerRouter;
