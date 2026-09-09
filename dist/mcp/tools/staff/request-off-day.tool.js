"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestOffDayMcpTool = void 0;
const zod_1 = require("zod");
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const common_validate_1 = require("../../../validation/common.validate");
const prisma_1 = require("../../../db/prisma");
const ApiError_1 = require("../../../utils/ApiError");
const offDay_service_1 = require("../../../service/staff/offDay.service");
const idempotency_1 = require("../../idempotency");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const inputSchema = {
    idempotencyKey: zod_1.z.string().trim().min(1).max(200),
    offDate: common_validate_1.dateOnlySchema.describe("Leave start date formatted as YYYY-MM-DD."),
    offDateEnd: common_validate_1.dateOnlySchema
        .optional()
        .describe("Optional leave end date formatted as YYYY-MM-DD."),
    reason: zod_1.z.string().trim().max(100).optional(),
};
exports.requestOffDayMcpTool = {
    name: "request_off_day",
    description: "Submit a leave request for the authenticated staff member. The request is created as PENDING and requires manager approval.",
    access: "SELF_READ",
    mode: "write",
    inputSchema,
    execute: async (input, context) => (0, idempotency_1.runWithMcpIdempotency)({
        shopId: context.shopId,
        userId: context.userId,
        operation: "request_off_day",
        idempotencyKey: input.idempotencyKey,
    }, async () => {
        const offDate = dayjs_1.default
            .tz(input.offDate, context.timezone)
            .startOf("day")
            .toDate();
        const offDateEnd = input.offDateEnd
            ? dayjs_1.default.tz(input.offDateEnd, context.timezone).startOf("day").toDate()
            : undefined;
        const today = dayjs_1.default
            .tz(context.currentDate, context.timezone)
            .startOf("day")
            .toDate();
        if (offDate < today) {
            throw new ApiError_1.ApiError(400, "Off-day date cannot be in the past");
        }
        if (offDateEnd) {
            offDateEnd.setHours(0, 0, 0, 0);
            if (offDateEnd < offDate) {
                throw new ApiError_1.ApiError(400, "End date must be after start date");
            }
        }
        const staff = await prisma_1.db.shopStaff.findFirst({
            where: {
                shopId: context.shopId,
                userId: context.userId,
                isActive: true,
            },
            select: { id: true },
        });
        if (!staff) {
            throw new ApiError_1.ApiError(404, "Authenticated staff member not found in this shop");
        }
        const offDay = await (0, offDay_service_1.requestOffDayService)(context.shopSlug, staff.id, context.userId, {
            offDate,
            offDateEnd,
            reason: input.reason,
        });
        return {
            offDayId: offDay.id,
            status: offDay.status,
            offDate: offDay.offDate.toISOString(),
            offDateEnd: offDay.offDateEnd?.toISOString() ?? null,
            reason: offDay.reason,
        };
    }),
};
