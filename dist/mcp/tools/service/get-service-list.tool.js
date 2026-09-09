"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceListMcpTool = void 0;
const zod_1 = require("zod");
const service_service_1 = require("../../../service/service/service.service");
const inputSchema = {
    page: zod_1.z.coerce.number().int().min(1).max(10000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    search: zod_1.z.string().trim().max(100).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
    category: zod_1.z.string().trim().max(100).optional(),
    sort: zod_1.z
        .enum([
        "RECENT",
        "NAME_ASC",
        "NAME_DESC",
        "PRICE_ASC",
        "PRICE_DESC",
        "DURATION_ASC",
        "DURATION_DESC",
    ])
        .optional(),
};
exports.getServiceListMcpTool = {
    name: "get_service_list",
    description: "Get a compact list of services in the current shop. Supports search, category, active status, pagination, and sorting. Return service name, price, duration, category, and status only.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const result = await (0, service_service_1.getService)(context.shopSlug, {
            page: input.page ?? 1,
            limit: input.limit ?? 20,
            search: input.search,
            status: input.status,
            category: input.category,
            sort: input.sort,
        });
        return {
            items: result.items.map((service) => ({
                serviceId: service.id,
                name: service.name,
                description: service.description,
                basePrice: service.basePrice,
                durationMin: service.durationMin,
                category: service.category?.name ?? null,
                isActive: service.isActive,
            })),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            counts: result.counts,
        };
    },
};
