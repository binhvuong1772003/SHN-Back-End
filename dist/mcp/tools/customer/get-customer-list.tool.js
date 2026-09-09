"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerListMcpTool = void 0;
const zod_1 = require("zod");
const common_validate_1 = require("../../../validation/common.validate");
const customer_service_1 = require("../../../service/customer/customer.service");
const inputSchema = {
    page: zod_1.z.coerce.number().int().min(1).max(10000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    search: zod_1.z.string().trim().max(100).optional(),
    sort: zod_1.z
        .enum([
        "SPEND_DESC",
        "VISITS_DESC",
        "RECENT_VISIT",
        "LONGEST_INACTIVE",
        "NEWEST",
    ])
        .optional(),
    retention: zod_1.z.enum(["ALL", "NEW", "RETURNING"]).optional(),
    hasUpcomingAppointment: zod_1.z.boolean().optional(),
    lastVisitBefore: common_validate_1.dateOnlySchema.optional(),
};
exports.getCustomerListMcpTool = {
    name: "get_customer_list",
    description: "Get a paginated list of customers who have used services at the current shop. Search by customer name or email, filter by retention and upcoming appointments, and sort by spending or visits.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => (0, customer_service_1.getCustomerList)(context.shopSlug, {
        page: input.page ?? 1,
        limit: input.limit ?? 20,
        search: input.search,
        sort: input.sort,
        retention: input.retention,
        hasUpcomingAppointment: input.hasUpcomingAppointment,
        lastVisitBefore: input.lastVisitBefore,
        usedOnly: true,
    }),
};
