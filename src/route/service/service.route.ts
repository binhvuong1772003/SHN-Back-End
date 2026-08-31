import { authenticate } from "@/middleware/authenticate.middleware";
import { Router } from "express";
import { validate } from "@/middleware/validation.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";
import categoryRouter from "./category.route";
import addonRouter from "./addon.route";
import servicePackageRouter from "./servicePackage.route";
import {
  createServiceController,
  getSerivceController,
  getServiceByIdController,
  updateServiceController,
  countServiceController,
} from "@/controller/service/service.controller";
import {
  createServiceSchema,
  updateServiceSchema,
} from "@/validation/service.validate";
import serviceOptionRouter from "./serviceOption.route";
import multer from "multer";
import { upload } from "@/middleware/upload.middleware";
import { validateMultipartBody } from "@/middleware/validateMultipartBody.middleware";
import { uploadServiceImage } from "@/middleware/uploadImageToCloudinary.middleware";
import { idParamSchema } from "@/validation/common.validate";

const serviceRouter = Router({ mergeParams: true });
serviceRouter.use(requireShopAccess());
serviceRouter.post(
  "/",
  requireShopAccess("OWNER"),
  upload.single("image"),
  uploadServiceImage,
  validateMultipartBody(createServiceSchema),
  createServiceController,
);
serviceRouter.get("/", getSerivceController);
serviceRouter.get("/count", countServiceController);
serviceRouter.use(categoryRouter);
serviceRouter.use("/addons", addonRouter);
serviceRouter.use("/packages", servicePackageRouter);
serviceRouter.use("/:serviceId/options", serviceOptionRouter);
serviceRouter.get("/:serviceId", validate({ params: idParamSchema("serviceId") }), getServiceByIdController);
serviceRouter.patch(
  "/:serviceId",
  requireShopAccess("OWNER"),
  validate({ params: idParamSchema("serviceId"), body: updateServiceSchema }),
  updateServiceController,
);

export default serviceRouter;
