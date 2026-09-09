"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopHoursMcpTool = void 0;
const shop_service_1 = require("../../../service/shop/shop.service");
const common_validate_1 = require("../../../validation/common.validate");
const inputSchema = {
    date: common_validate_1.dateOnlySchema
        .optional()
        .describe("Date formatted as YYYY-MM-DD. Omit to return the weekly hours."),
};
exports.getShopHoursMcpTool = {
    name: "get_shop_hours",
    description: "Get the current shop's business hours. Omit date for weekly hours or provide YYYY-MM-DD to inspect a specific day.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const hours = await (0, shop_service_1.getBusinessHoursService)(context.shopSlug);
        const selectedHours = input.date
            ? hours.filter((item) => item.dayOfWeek ===
                new Date(`${input.date}T00:00:00.000Z`).getUTCDay())
            : hours;
        return {
            date: input.date ?? null,
            hours: selectedHours.map((item) => ({
                dayOfWeek: item.dayOfWeek,
                openTime: item.openTime,
                closeTime: item.closeTime,
                isClosed: item.isClosed,
            })),
        };
    },
};
