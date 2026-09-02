import { Router } from "express";
import { chatAIController } from "@/controller/ai/ai.controller";
import { authenticate } from "@/middleware/authenticate.middleware";
import { requireShopAccess } from "@/middleware/shop.middleware";

const router = Router({ mergeParams: true });

router.post(
  "/shops/:shopSlug/chat",
  authenticate,
  requireShopAccess("STAFF"),
  chatAIController,
);

export default router;
