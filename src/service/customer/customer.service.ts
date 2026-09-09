import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const findShopCustomers = async (
  shopSlug: string,
  query: { email?: string; phone?: string },
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const email = query.email?.trim().toLowerCase();
  const phone = query.phone?.trim();
  if (!email && !phone) {
    throw new ApiError(400, "Email or phone is required");
  }

  const customerConditions = [
    ...(email
      ? [{ email: { equals: email, mode: "insensitive" as const } }]
      : []),
    ...(phone ? [{ phone }] : []),
  ];

  return db.shopCustomer.findMany({
    where: {
      shopId: shop.id,
      totalVisits: { gt: 0 },
      isBlocked: false,
      customer: {
        role: "CUSTOMER",
        isActive: true,
        OR: customerConditions,
      },
    },
    select: {
      id: true,
      customerId: true,
      totalBookings: true,
      totalVisits: true,
      totalSpent: true,
      lastVisitAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { lastVisitAt: "desc" },
    take: 20,
  });
};

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

type CustomerListQuery = {
  page: number;
  limit: number;
  search?: string;
  sort?:
    | "SPEND_DESC"
    | "VISITS_DESC"
    | "RECENT_VISIT"
    | "LONGEST_INACTIVE"
    | "NEWEST";
  retention?: "ALL" | "NEW" | "RETURNING";
  hasUpcomingAppointment?: boolean;
  lastVisitBefore?: string;
  usedOnly?: boolean;
};

const upcomingStatuses = ["CANCELLED", "NO_SHOW"] as const;

const retentionStatus = (totalVisits: number): "NEW" | "RETURNING" =>
  totalVisits > 1 ? "RETURNING" : "NEW";

const toCustomerSummary = (
  item: any,
  nextAppointment: any,
  timezoneName: string,
) => {
  const now = dayjs().tz(timezoneName).startOf("day");
  const lastVisit = item.lastVisitAt
    ? dayjs(item.lastVisitAt).tz(timezoneName).startOf("day")
    : null;
  return {
    id: item.customer.id,
    shopCustomerId: item.id,
    name: item.customer.name,
    email: item.customer.email,
    avatarUrl: item.customer.avatarUrl,
    customerSince: item.firstBookingAt,
    lastVisitAt: item.lastVisitAt,
    daysSinceLastVisit: lastVisit
      ? Math.max(0, now.diff(lastVisit, "day"))
      : null,
    totalVisits: item.totalVisits,
    totalBookings: item.totalBookings,
    totalSpent: item.totalSpent,
    averageSpend: item.totalVisits > 0 ? item.totalSpent / item.totalVisits : 0,
    retentionStatus: retentionStatus(item.totalVisits),
    nextAppointment: nextAppointment
      ? {
          id: nextAppointment.id,
          date: nextAppointment.date,
          startTime: nextAppointment.startTime,
          endTime: nextAppointment.endTime,
          status: nextAppointment.status,
        }
      : null,
  };
};

const getUpcomingAppointmentsByCustomer = async (
  shopId: string,
  customerIds: string[],
  timezoneName: string,
) => {
  if (customerIds.length === 0) return new Map<string, any>();
  const today = dayjs().tz(timezoneName).startOf("day").toDate();
  const appointments = await db.appointment.findMany({
    where: {
      shopId,
      customerId: { in: customerIds },
      date: { gte: today },
      status: { notIn: [...upcomingStatuses] },
    },
    select: {
      id: true,
      customerId: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const result = new Map<string, any>();
  for (const appointment of appointments)
    if (!result.has(appointment.customerId))
      result.set(appointment.customerId, appointment);
  return result;
};

export const getCustomerList = async (
  shopSlug: string,
  query: CustomerListQuery,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  const today = dayjs().tz(shop.timezone).startOf("day").toDate();
  const search = query.search?.trim();
  const upcomingCondition = {
    shopId: shop.id,
    date: { gte: today },
    status: { notIn: [...upcomingStatuses] },
  };
  const where: any = {
    shopId: shop.id,
    ...(query.usedOnly ? { totalVisits: { gt: 0 } } : {}),
  };
  if (search) {
    where.customer = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  if (query.retention === "RETURNING") where.totalVisits = { gt: 1 };
  if (query.retention === "NEW") where.totalVisits = { lte: 1 };
  if (query.hasUpcomingAppointment !== undefined) {
    where.customer = {
      ...(where.customer ?? {}),
      customerAppointments: query.hasUpcomingAppointment
        ? { some: upcomingCondition }
        : { none: upcomingCondition },
    };
  }
  if (query.lastVisitBefore)
    where.lastVisitAt = {
      lt: dayjs.tz(query.lastVisitBefore, shop.timezone).endOf("day").toDate(),
    };

  const orderBy =
    query.sort === "VISITS_DESC"
      ? { totalVisits: "desc" as const }
      : query.sort === "RECENT_VISIT"
        ? { lastVisitAt: "desc" as const }
        : query.sort === "LONGEST_INACTIVE"
          ? { lastVisitAt: "asc" as const }
          : query.sort === "NEWEST"
            ? { createdAt: "desc" as const }
            : { totalSpent: "desc" as const };

  const [total, returningCustomers, newCustomers, neverVisited, items] =
    await Promise.all([
      db.shopCustomer.count({ where }),
      db.shopCustomer.count({ where: { ...where, totalVisits: { gt: 1 } } }),
      db.shopCustomer.count({ where: { ...where, totalVisits: { lte: 1 } } }),
      db.shopCustomer.count({ where: { ...where, lastVisitAt: null } }),
      db.shopCustomer.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          customer: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
    ]);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const safePage = Math.min(query.page, totalPages);
  const pageItems =
    safePage === query.page
      ? items
      : await db.shopCustomer.findMany({
          where,
          orderBy,
          skip: (safePage - 1) * query.limit,
          take: query.limit,
          include: {
            customer: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        });
  const upcoming = await getUpcomingAppointmentsByCustomer(
    shop.id,
    pageItems.map((item) => item.customerId),
    shop.timezone,
  );
  return {
    items: pageItems.map((item) =>
      toCustomerSummary(item, upcoming.get(item.customerId), shop.timezone),
    ),
    meta: {
      total,
      page: safePage,
      limit: query.limit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
      summary: {
        totalCustomers: total,
        returningCustomers,
        newCustomers,
        neverVisited,
      },
    },
  };
};

export const getCustomerDetail = async (
  shopSlug: string,
  customerId: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  const shopCustomer = await db.shopCustomer.findFirst({
    where: { shopId: shop.id, customerId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });
  if (!shopCustomer) throw new ApiError(404, "Customer not found in this shop");
  const today = dayjs().tz(shop.timezone).startOf("day").toDate();
  const [appointments, upcomingAppointments, serviceRows] = await Promise.all([
    db.appointment.findMany({
      where: { shopId: shop.id, customerId },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 50,
      include: {
        services: {
          select: {
            id: true,
            serviceName: true,
            priceAtBooking: true,
            durationMin: true,
          },
        },
        staff: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            user: { select: { name: true, email: true, avatarUrl: true } },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            method: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    }),
    db.appointment.findMany({
      where: {
        shopId: shop.id,
        customerId,
        date: { gte: today },
        status: { notIn: [...upcomingStatuses] },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
      include: {
        services: { select: { id: true, serviceName: true } },
        staff: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            user: { select: { name: true, email: true, avatarUrl: true } },
          },
        },
      },
    }),
    db.appointmentService.findMany({
      where: { appointment: { is: { shopId: shop.id, customerId } } },
      select: { serviceName: true },
    }),
  ]);
  const serviceCounts = new Map<string, number>();
  for (const row of serviceRows)
    serviceCounts.set(
      row.serviceName,
      (serviceCounts.get(row.serviceName) ?? 0) + 1,
    );
  const mostBookedServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, visits]) => ({ name, visits }));
  const staffCounts = new Map<string, { name: string; visits: number }>();
  for (const appointment of appointments) {
    if (!appointment.staff) continue;
    const current = staffCounts.get(appointment.staff.id) ?? {
      name: appointment.staff.user.name,
      visits: 0,
    };
    current.visits += 1;
    staffCounts.set(appointment.staff.id, current);
  }
  const mostVisitedStaff = [...staffCounts.entries()]
    .sort((a, b) => b[1].visits - a[1].visits)
    .slice(0, 3)
    .map(([id, value]) => ({ id, ...value }));
  return {
    ...toCustomerSummary(shopCustomer, upcomingAppointments[0], shop.timezone),
    customer: shopCustomer.customer,
    firstVisitAt: shopCustomer.firstVisitAt,
    note: shopCustomer.note,
    mostBookedServices,
    mostVisitedStaff,
    appointments,
    upcomingAppointments,
  };
};
