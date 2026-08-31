import type { PaymentMethod, PaymentStatus, Prisma, ShopRole } from "@prisma/client";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import type {
  ConfirmPaymentInput,
  CreatePaymentInput,
} from "@/validation/payment.validate";
import type { PaymentListQuery } from "@/validation/payment-management.validate";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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
} satisfies Prisma.PaymentInclude;

const assertPaymentManager = (role: ShopRole | undefined) => {
  if (role !== "OWNER" && role !== "MANAGER") {
    throw new ApiError(403, "Only shop managers can confirm payments");
  }
};

const paymentStatusFromAmount = (paidAmount: number, amount: number): PaymentStatus => {
  if (paidAmount <= 0) return "PENDING";
  if (paidAmount >= amount) return "PAID";
  return "PARTIAL";
};

const getAppointmentForPayment = async (shopSlug: string, appointmentId: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, shopId: shop.id },
    select: { id: true, shopId: true, status: true, totalAmount: true },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
    throw new ApiError(409, "Cancelled or no-show appointments cannot be paid");
  }

  return { shop, appointment };
};

export const createPayment = async (
  shopSlug: string,
  appointmentId: string,
  actorUserId: string,
  input: CreatePaymentInput,
) => {
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  const { shop, appointment } = await getAppointmentForPayment(shopSlug, appointmentId);

  const existing = await db.payment.findUnique({ where: { appointmentId: appointment.id } });
  if (existing) return { payment: existing, created: false };

  const payment = await db.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: appointment.totalAmount,
        method: input.method as PaymentMethod,
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

export const getPayment = async (shopSlug: string, appointmentId: string) => {
  const { appointment } = await getAppointmentForPayment(shopSlug, appointmentId);
  return db.payment.findUnique({ where: { appointmentId: appointment.id } });
};

export const getPaymentList = async (
  shopSlug: string,
  query: PaymentListQuery,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const search = query.search?.trim();
  const idSearch = search && /^[0-9a-fA-F]{24}$/.test(search);
  const createdAt = query.from || query.to
    ? {
        ...(query.from
          ? { gte: dayjs.tz(query.from, shop.timezone).startOf("day").toDate() }
          : {}),
        ...(query.to
          ? { lte: dayjs.tz(query.to, shop.timezone).endOf("day").toDate() }
          : {}),
      }
    : undefined;

  const baseWhere: Prisma.PaymentWhereInput = {
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
          } satisfies Prisma.PaymentWhereInput]
        : []),
    ],
    ...(createdAt ? { createdAt } : {}),
    ...(query.method ? { method: query.method } : {}),
  };
  const where: Prisma.PaymentWhereInput = {
    ...baseWhere,
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, statusGroups, collected, transactions] = await Promise.all([
    db.payment.count({ where }),
    db.payment.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    db.payment.aggregate({
      where: { ...baseWhere, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
    }),
    db.payment.count({ where: baseWhere }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const safePage = Math.min(query.page, totalPages);
  const items = await db.payment.findMany({
    where,
    skip: (safePage - 1) * query.limit,
    take: query.limit,
    include: paymentDetailInclude,
    orderBy: { createdAt: "desc" },
  });
  const statusCounts: Record<PaymentStatus, number> = {
    PENDING: 0,
    PARTIAL: 0,
    PAID: 0,
    REFUNDED: 0,
  };
  for (const group of statusGroups) statusCounts[group.status] = group._count._all;

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

export const getPaymentDetail = async (shopSlug: string, paymentId: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  const payment = await db.payment.findFirst({
    where: { id: paymentId, appointment: { is: { shopId: shop.id } } },
    include: paymentDetailInclude,
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  return payment;
};

export const confirmPayment = async (
  shopSlug: string,
  appointmentId: string,
  actorUserId: string,
  actorRole: ShopRole | undefined,
  input: ConfirmPaymentInput,
) => {
  assertPaymentManager(actorRole);
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  const { shop, appointment } = await getAppointmentForPayment(shopSlug, appointmentId);

  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { appointmentId: appointment.id },
    });
    if (!payment) throw new ApiError(404, "Payment has not been created");
    if (payment.status === "PAID") {
      throw new ApiError(409, "Payment has already been confirmed");
    }
    if (input.paidAmount > payment.amount) {
      throw new ApiError(400, "Paid amount cannot exceed payment amount");
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
