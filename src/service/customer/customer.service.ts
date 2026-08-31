import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";

export const getTopCustomer = async (shopSlug: string, limit: number = 5) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  // shopId is a MongoDB ObjectId and must use $oid.
  const result = await db.appointment.aggregateRaw({
    pipeline: [
      {
        $match: {
          shopId: { $oid: shop.id },
          status: { $in: ["CONFIRMED", "COMPLETED"] },
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
