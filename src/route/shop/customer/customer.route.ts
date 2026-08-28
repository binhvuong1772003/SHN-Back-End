import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.middleware";
import { validate } from "@/middleware/validation.middleware";
import { getTopCustomerController } from "@/controller/customer/customer.controller";
const customerRouter = Router({ mergeParams: true });

customerRouter.get("/top", getTopCustomerController);
export default customerRouter;
