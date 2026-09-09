"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffListMcpTool = void 0;
const zod_1 = require("zod");
const staff_service_1 = require("../../../service/staff/staff.service");
const inputSchema = {
    page: zod_1.z.coerce.number().int().min(1).max(10000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    search: zod_1.z.string().trim().max(100).optional(),
    role: zod_1.z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
    sort: zod_1.z.enum(["RECENT", "NAME_ASC", "NAME_DESC", "REVENUE"]).optional(),
};
exports.getStaffListMcpTool = {
    name: "get_staff_list",
    description: "Get a compact list of staff members in the current shop. Return only name, nickname, role, and work status; never expose email or other private profile fields unless explicitly requested.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const result = await (0, staff_service_1.getStaffListByShopService)(context.shopSlug, {
            page: input.page ?? 1,
            limit: input.limit ?? 20,
            search: input.search,
            role: input.role,
            status: input.status,
            sort: input.sort,
        });
        return {
            items: result.items.map((staff) => ({
                staffId: staff.id,
                name: staff.user.name,
                nickname: staff.nickname,
                role: staff.role,
                status: staff.isOnLeave
                    ? "ON_LEAVE"
                    : staff.isActive
                        ? "ACTIVE"
                        : "INACTIVE",
            })),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    },
};
