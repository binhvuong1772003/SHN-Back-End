"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPayment = exports.getPaymentDetail = exports.getPaymentList = exports.getPayment = exports.createPayment = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const paymentDetailInclude = {
    appointment: {
        select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true,
            subtotal: true,
            discountAmount: true,
            totalAmount: true,
            note: true,
            customer: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
            staff: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
            services: {
                select: {
                    id: true,
                    serviceName: true,
                    priceAtBooking: true,
                    durationMin: true,
                    selectedValues: {
                        select: {
                            id: true,
                            priceAtBooking: true,
                            optionValue: { select: { id: true, name: true } },
                        },
                    },
                },
            },
            packages: {
                select: {
                    id: true,
                    priceAtBooking: true,
                    package: { select: { id: true, name: true } },
                },
            },
            addons: {
                select: {
                    id: true,
                    priceAtBooking: true,
                    addon: { select: { id: true, name: true } },
                },
            },
        },
    },
};
const assertPaymentManager = (role) => {
    if (role !== "OWNER" && role !== "MANAGER") {
        throw new ApiError_1.ApiError(403, "Only shop managers can confirm payments");
    }
};
const paymentStatusFromAmount = (paidAmount, amount) => {
    if (paidAmount <= 0)
        return "PENDING";
    if (paidAmount >= amount)
        return "PAID";
    return "PARTIAL";
};
const getAppointmentForPayment = async (shopSlug, appointmentId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const appointment = await prisma_1.db.appointment.findFirst({
        where: { id: appointmentId, shopId: shop.id },
        select: { id: true, shopId: true, status: true, totalAmount: true },
    });
    if (!appointment)
        throw new ApiError_1.ApiError(404, "Appointment not found");
    if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
        throw new ApiError_1.ApiError(409, "Cancelled or no-show appointments cannot be paid");
    }
    return { shop, appointment };
};
const createPayment = async (shopSlug, appointmentId, actorUserId, input) => {
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { shop, appointment } = await getAppointmentForPayment(shopSlug, appointmentId);
    const existing = await prisma_1.db.payment.findUnique({ where: { appointmentId: appointment.id } });
    if (existing)
        return { payment: existing, created: false };
    const payment = await prisma_1.db.$transaction(async (tx) => {
        const createdPayment = await tx.payment.create({
            data: {
                appointmentId: appointment.id,
                amount: appointment.totalAmount,
                method: input.method,
                note: input.note,
            },
        });
        await tx.auditLog.create({
            data: {
                shopId: shop.id,
                userId: actorUserId,
                action: "PAYMENT_CREATED",
                entity: "Payment",
                entityId: createdPayment.id,
                changes: {
                    appointmentId: appointment.id,
                    amount: createdPayment.amount,
                    method: createdPayment.method,
                },
            },
        });
        return createdPayment;
    });
    return { payment, created: true };
};
exports.createPayment = createPayment;
const getPayment = async (shopSlug, appointmentId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const appointment = await prisma_1.db.appointment.findFirst({
        where: { id: appointmentId, shopId: shop.id },
        select: { id: true },
    });
    if (!appointment)
        throw new ApiError_1.ApiError(404, "Appointment not found");
    return prisma_1.db.payment.findUnique({ where: { appointmentId: appointment.id } });
};
exports.getPayment = getPayment;
const getPaymentList = async (shopSlug, query) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const search = query.search?.trim();
    const idSearch = search && /^[0-9a-fA-F]{24}$/.test(search);
    const createdAt = query.from || query.to
        ? {
            ...(query.from
                ? { gte: dayjs_1.default.tz(query.from, shop.timezone).startOf("day").toDate() }
                : {}),
            ...(query.to
                ? { lte: dayjs_1.default.tz(query.to, shop.timezone).endOf("day").toDate() }
                : {}),
        }
        : undefined;
    const baseWhere = {
        AND: [
            { appointment: { is: { shopId: shop.id } } },
            ...(search
                ? [{
                        OR: [
                            { transactionId: { contains: search } },
                            { appointment: { is: { customer: { is: { name: { contains: search } } } } } },
                            { appointment: { is: { staff: { is: { name: { contains: search } } } } } },
                            ...(idSearch ? [{ id: search }, { appointmentId: search }] : []),
                        ],
                    }]
                : []),
        ],
        ...(createdAt ? { createdAt } : {}),
        ...(query.method ? { method: query.method } : {}),
    };
    const where = {
        ...baseWhere,
        ...(query.status ? { status: query.status } : {}),
    };
    const [total, statusGroups, collected, transactions] = await Promise.all([
        prisma_1.db.payment.count({ where }),
        prisma_1.db.payment.groupBy({
            by: ["status"],
            where: baseWhere,
            _count: { _all: true },
        }),
        prisma_1.db.payment.aggregate({
            where: { ...baseWhere, paidAmount: { gt: 0 } },
            _sum: { paidAmount: true },
        }),
        prisma_1.db.payment.count({ where: baseWhere }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    const safePage = Math.min(query.page, totalPages);
    const items = await prisma_1.db.payment.findMany({
        where,
        skip: (safePage - 1) * query.limit,
        take: query.limit,
        include: paymentDetailInclude,
        orderBy: { createdAt: "desc" },
    });
    const statusCounts = {
        PENDING: 0,
        PARTIAL: 0,
        PAID: 0,
        REFUNDED: 0,
    };
    for (const group of statusGroups)
        statusCounts[group.status] = group._count._all;
    return {
        items,
        meta: {
            total,
            page: safePage,
            limit: query.limit,
            totalPages,
            hasNext: safePage < totalPages,
            hasPrev: safePage > 1,
            summary: {
                totalCollected: collected._sum.paidAmount ?? 0,
                transactions,
                statusCounts,
            },
        },
    };
};
exports.getPaymentList = getPaymentList;
const getPaymentDetail = async (shopSlug, paymentId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const payment = await prisma_1.db.payment.findFirst({
        where: { id: paymentId, appointment: { is: { shopId: shop.id } } },
        include: paymentDetailInclude,
    });
    if (!payment)
        throw new ApiError_1.ApiError(404, "Payment not found");
    return payment;
};
exports.getPaymentDetail = getPaymentDetail;
const confirmPayment = async (shopSlug, appointmentId, actorUserId, actorRole, input) => {
    assertPaymentManager(actorRole);
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { shop, appointment } = await getAppointmentForPayment(shopSlug, appointmentId);
    return prisma_1.db.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
            where: { appointmentId: appointment.id },
        });
        if (!payment)
            throw new ApiError_1.ApiError(404, "Payment has not been created");
        if (payment.status === "PAID") {
            throw new ApiError_1.ApiError(409, "Payment has already been confirmed");
        }
        if (payment.status === "REFUNDED") {
            throw new ApiError_1.ApiError(409, "Refunded payments cannot be confirmed");
        }
        if (input.paidAmount > payment.amount) {
            throw new ApiError_1.ApiError(400, "Paid amount cannot exceed payment amount");
        }
        const status = paymentStatusFromAmount(input.paidAmount, payment.amount);
        const updated = await tx.payment.update({
            where: { id: payment.id },
            data: {
                paidAmount: input.paidAmount,
                status,
                paidAt: status === "PAID" ? new Date() : null,
                ...(input.transactionId !== undefined
                    ? { transactionId: input.transactionId }
                    : {}),
                ...(input.note !== undefined ? { note: input.note } : {}),
            },
        });
        await tx.auditLog.create({
            data: {
                shopId: shop.id,
                userId: actorUserId,
                action: "PAYMENT_CONFIRMED",
                entity: "Payment",
                entityId: payment.id,
                changes: {
                    appointmentId: appointment.id,
                    fromStatus: payment.status,
                    toStatus: status,
                    fromPaidAmount: payment.paidAmount,
                    toPaidAmount: input.paidAmount,
                    transactionId: input.transactionId ?? payment.transactionId,
                },
            },
        });
        return updated;
    });
};
exports.confirmPayment = confirmPayment;
