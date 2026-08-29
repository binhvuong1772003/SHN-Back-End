"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopCustomer = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const getTopCustomer = async (shopSlug, limit = 5) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    // shopId trong MongoDB là ObjectId, cần dùng $oid
    const result = await prisma_1.db.appointment.aggregateRaw({
        pipeline: [
            {
                $match: {
                    shopId: { $oid: shop.id },
                    status: { $in: ["CONFIRMED", "DONE"] },
                },
            },
            {
                $group: {
                    _id: "$customerId",
                    lastAppointmentDate: { $max: "$date" },
                    totalSpent: { $sum: "$totalAmount" },
                    totalAppointments: { $sum: 1 },
                },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    let: { customerId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$customerId"] },
                            },
                        },
                    ],
                    as: "customer",
                },
            },
            { $unwind: "$customer" },
            {
                $project: {
                    _id: 0,
                    id: "$customer._id",
                    name: "$customer.name",
                    avatarUrl: "$customer.avatarUrl",
                    phone: "$customer.phone",
                    lastAppointmentDate: 1,
                    totalSpent: 1,
                    totalAppointments: 1,
                },
            },
        ],
    });
    return result;
};
exports.getTopCustomer = getTopCustomer;
