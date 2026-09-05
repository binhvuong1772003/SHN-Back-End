"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConversationMessageListQuerySchema = exports.aiConversationListQuerySchema = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../validation/common.validate");
exports.aiConversationListQuerySchema = zod_1.z.object({
    cursor: common_validate_1.objectIdSchema.optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
});
exports.aiConversationMessageListQuerySchema = exports.aiConversationListQuerySchema;
