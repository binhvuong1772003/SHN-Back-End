"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../../controller/ai/ai.controller");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const shop_middleware_1 = require("../../middleware/shop.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/shops/:shopSlug/chat", authenticate_middleware_1.authenticate, (0, shop_middleware_1.requireShopAccess)("STAFF"), ai_controller_1.chatAIController);
exports.default = router;
