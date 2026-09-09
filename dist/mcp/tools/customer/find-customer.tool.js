"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCustomerMcpTool = void 0;
const zod_1 = require("zod");
const customer_service_1 = require("../../../service/customer/customer.service");
const inputSchema = {
    email: zod_1.z.string().trim().email().optional(),
    phone: zod_1.z.string().trim().min(6).max(20).optional(),
};
exports.findCustomerMcpTool = {
    name: "find_customer",
    description: "Find customers who have already used a service at the current shop by exact email or phone. Returns User customerId for create_appointment; do not use shopCustomerId as customerId.",
    access: "SHOP_READ",
    mode: "read",
    inputSchema,
    execute: async (input, context) => {
        const customers = await (0, customer_service_1.findShopCustomers)(context.shopSlug, input);
        return {
            items: customers.map((item) => ({
                customerId: item.customerId,
                shopCustomerId: item.id,
                name: item.customer.name,
                email: item.customer.email,
                phone: item.customer.phone,
                totalBookings: item.totalBookings,
                totalVisits: item.totalVisits,
                totalSpent: item.totalSpent,
                lastVisitAt: item.lastVisitAt?.toISOString() ?? null,
            })),
        };
    },
};
