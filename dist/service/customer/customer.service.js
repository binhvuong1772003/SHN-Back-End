"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerDetail = exports.getCustomerList = exports.getTopCustomer = exports.findShopCustomers = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const findShopCustomers = async (shopSlug, query) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const email = query.email?.trim().toLowerCase();
    const phone = query.phone?.trim();
    if (!email && !phone) {
        throw new ApiError_1.ApiError(400, "Email or phone is required");
    }
    const customerConditions = [
        ...(email
            ? [{ email: { equals: email, mode: "insensitive" } }]
            : []),
        ...(phone ? [{ phone }] : []),
    ];
    return prisma_1.db.shopCustomer.findMany({
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
exports.findShopCustomers = findShopCustomers;
const getTopCustomer = async (shopSlug, limit = 5) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    // shopId is a MongoDB ObjectId and must use $oid.
    const result = await prisma_1.db.appointment.aggregateRaw({
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
exports.getTopCustomer = getTopCustomer;
const upcomingStatuses = ["CANCELLED", "NO_SHOW"];
const retentionStatus = (totalVisits) => totalVisits > 1 ? "RETURNING" : "NEW";
const toCustomerSummary = (item, nextAppointment, timezoneName) => {
    const now = (0, dayjs_1.default)().tz(timezoneName).startOf("day");
    const lastVisit = item.lastVisitAt
        ? (0, dayjs_1.default)(item.lastVisitAt).tz(timezoneName).startOf("day")
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
const getUpcomingAppointmentsByCustomer = async (shopId, customerIds, timezoneName) => {
    if (customerIds.length === 0)
        return new Map();
    const today = (0, dayjs_1.default)().tz(timezoneName).startOf("day").toDate();
    const appointments = await prisma_1.db.appointment.findMany({
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
    const result = new Map();
    for (const appointment of appointments)
        if (!result.has(appointment.customerId))
            result.set(appointment.customerId, appointment);
    return result;
};
const getCustomerList = async (shopSlug, query) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const today = (0, dayjs_1.default)().tz(shop.timezone).startOf("day").toDate();
    const search = query.search?.trim();
    const upcomingCondition = {
        shopId: shop.id,
        date: { gte: today },
        status: { notIn: [...upcomingStatuses] },
    };
    const where = {
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
    if (query.retention === "RETURNING")
        where.totalVisits = { gt: 1 };
    if (query.retention === "NEW")
        where.totalVisits = { lte: 1 };
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
            lt: dayjs_1.default.tz(query.lastVisitBefore, shop.timezone).endOf("day").toDate(),
        };
    const orderBy = query.sort === "VISITS_DESC"
        ? { totalVisits: "desc" }
        : query.sort === "RECENT_VISIT"
            ? { lastVisitAt: "desc" }
            : query.sort === "LONGEST_INACTIVE"
                ? { lastVisitAt: "asc" }
                : query.sort === "NEWEST"
                    ? { createdAt: "desc" }
                    : { totalSpent: "desc" };
    const [total, returningCustomers, newCustomers, neverVisited, items] = await Promise.all([
        prisma_1.db.shopCustomer.count({ where }),
        prisma_1.db.shopCustomer.count({ where: { ...where, totalVisits: { gt: 1 } } }),
        prisma_1.db.shopCustomer.count({ where: { ...where, totalVisits: { lte: 1 } } }),
        prisma_1.db.shopCustomer.count({ where: { ...where, lastVisitAt: null } }),
        prisma_1.db.shopCustomer.findMany({
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
    const pageItems = safePage === query.page
        ? items
        : await prisma_1.db.shopCustomer.findMany({
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
    const upcoming = await getUpcomingAppointmentsByCustomer(shop.id, pageItems.map((item) => item.customerId), shop.timezone);
    return {
        items: pageItems.map((item) => toCustomerSummary(item, upcoming.get(item.customerId), shop.timezone)),
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
exports.getCustomerList = getCustomerList;
const getCustomerDetail = async (shopSlug, customerId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const shopCustomer = await prisma_1.db.shopCustomer.findFirst({
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
    if (!shopCustomer)
        throw new ApiError_1.ApiError(404, "Customer not found in this shop");
    const today = (0, dayjs_1.default)().tz(shop.timezone).startOf("day").toDate();
    const [appointments, upcomingAppointments, serviceRows] = await Promise.all([
        prisma_1.db.appointment.findMany({
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
        prisma_1.db.appointment.findMany({
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
        prisma_1.db.appointmentService.findMany({
            where: { appointment: { is: { shopId: shop.id, customerId } } },
            select: { serviceName: true },
        }),
    ]);
    const serviceCounts = new Map();
    for (const row of serviceRows)
        serviceCounts.set(row.serviceName, (serviceCounts.get(row.serviceName) ?? 0) + 1);
    const mostBookedServices = [...serviceCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, visits]) => ({ name, visits }));
    const staffCounts = new Map();
    for (const appointment of appointments) {
        if (!appointment.staff)
            continue;
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
exports.getCustomerDetail = getCustomerDetail;
