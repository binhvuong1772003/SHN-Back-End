import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import { CreateAppointmentInput } from "@/validation/appointment";
import { validateBookingSlot } from "@/service/calendar/calendar.service";
import { addMinutesToTime, timeToMinutes } from "@/helper/slot.helper";
import {
  priceDiscountCalculate,
  incrementPromotionUsage,
} from "@/helper/price.helper";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { getIO } from "@/socket";
import type { AppointmentStatus, Prisma, ShopRole } from "@prisma/client";

const appointmentTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const assertManagerCanChangeStatus = (role: ShopRole | undefined) => {
  if (role !== "OWNER" && role !== "MANAGER") {
    throw new ApiError(403, "Only shop managers can change appointment status");
  }
};

const isAppointmentStatus = (status: string): status is AppointmentStatus =>
  [
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ].includes(status);
export const createAppointment = async (
  data: CreateAppointmentInput,
  customerId: string,
  shopSlug: string,
  actorUserId: string,
) => {
  if (!customerId || !actorUserId) throw new ApiError(401, "Unauthorized");
  const {
    staffId,
    date,
    startTime,
    serviceIds,
    serviceOptions,
    packageIds,
    addonIds,
    note,
    source,
    promotionId,
  } = data;

  // Get shop first
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const bookingForAnotherCustomer = actorUserId !== customerId;
  if (bookingForAnotherCustomer) {
    const actorStaff = await db.shopStaff.findFirst({
      where: { shopId: shop.id, userId: actorUserId, isActive: true },
      select: { role: true },
    });
    if (!actorStaff || !["MANAGER", "OWNER"].includes(actorStaff.role)) {
      throw new ApiError(
        403,
        "Only managers can create appointments for another customer",
      );
    }

    const shopCustomer = await db.shopCustomer.findUnique({
      where: {
        shopId_customerId: {
          shopId: shop.id,
          customerId,
        },
      },
      select: { totalVisits: true, isBlocked: true },
    });
    if (
      !shopCustomer ||
      shopCustomer.isBlocked ||
      shopCustomer.totalVisits <= 0
    ) {
      throw new ApiError(
        403,
        "This customer has not used a service at this shop",
      );
    }
  }

  const customer = await db.user.findFirst({
    where: {
      id: customerId,
      role: "CUSTOMER",
      isActive: true,
    },
    select: { id: true },
  });
  if (!customer) {
    throw new ApiError(404, "Customer not found or inactive");
  }

  // Fetch services with their options
  const services = serviceIds?.length
    ? await db.service.findMany({
        where: { id: { in: serviceIds }, shopId: shop.id, isActive: true },
        include: {
          options: {
            where: { isRequired: true },
          },
        },
      })
    : [];

  const packages = packageIds?.length
    ? await db.servicePackage.findMany({
        where: { id: { in: packageIds }, shopId: shop.id, isActive: true },
        include: {
          items: {
            where: { isIncluded: true },
            select: { serviceId: true },
          },
        },
      })
    : [];

  const addons = addonIds?.length
    ? await db.addonService.findMany({
        where: { id: { in: addonIds }, shopId: shop.id, isActive: true },
      })
    : [];

  const allOptionValueIds =
    serviceOptions?.flatMap((so) => so.optionValueIds) ?? [];
  const optionValues = allOptionValueIds.length
    ? await db.optionValue.findMany({
        where: { id: { in: allOptionValueIds }, isActive: true },
      })
    : [];

  if (serviceIds?.length && services.length !== serviceIds.length) {
    throw new ApiError(
      404,
      "One or more services were not found or are unavailable",
    );
  }
  if (packageIds?.length && packages.length !== packageIds.length) {
    throw new ApiError(
      404,
      "One or more service packages were not found or are unavailable",
    );
  }
  if (addonIds?.length && addons.length !== addonIds.length) {
    throw new ApiError(
      404,
      "One or more add-ons were not found or are unavailable",
    );
  }

  let assignedStaffId: string | undefined;
  if (staffId) {
    const shopStaff = await db.shopStaff.findFirst({
      where: { id: staffId, shopId: shop.id, isActive: true },
      select: { id: true, userId: true },
    });
    if (!shopStaff) {
      throw new ApiError(404, "Staff not found in this shop");
    }

    const requestedServiceIds = [
      ...new Set([
        ...services.map((service) => service.id),
        ...packages.flatMap((servicePackage) =>
          servicePackage.items.map((item) => item.serviceId),
        ),
      ]),
    ];

    if (requestedServiceIds.length > 0) {
      const assignedServices = await db.staffService.findMany({
        where: {
          shopStaffId: shopStaff.id,
          serviceId: { in: requestedServiceIds },
          isActive: true,
          service: {
            shopId: shop.id,
            isActive: true,
          },
        },
        select: { serviceId: true },
      });
      const assignedServiceIds = new Set(
        assignedServices.map((service) => service.serviceId),
      );
      const unsupportedServiceIds = requestedServiceIds.filter(
        (serviceId) => !assignedServiceIds.has(serviceId),
      );

      if (unsupportedServiceIds.length > 0) {
        throw new ApiError(
          400,
          "The selected staff member cannot perform one or more selected services",
        );
      }
    }

    assignedStaffId = shopStaff.id;
  }

  if (services.length === 0 && packages.length === 0) {
    throw new ApiError(400, "At least one service or package is required");
  }

  // Validate required options are selected
  for (const service of services) {
    if (service.options && service.options.length > 0) {
      const serviceOptionData = serviceOptions?.find(
        (so) => so.serviceId === service.id,
      );
      if (!serviceOptionData || serviceOptionData.optionValueIds.length === 0) {
        throw new ApiError(
          400,
          `Service "${service.name}" requires an option selection`,
        );
      }
    }
  }

  // Calculate total duration: service base + option values + addons
  let totalDuration = 0;

  // Add base service durations
  totalDuration += services.reduce((sum, s) => sum + s.durationMin, 0);

  // Add option values durations
  totalDuration += optionValues.reduce(
    (sum, ov) => sum + (ov.duration ?? 0),
    0,
  );

  // Add addon durations
  totalDuration += addons.reduce((sum, a) => sum + (a.duration ?? 0), 0);

  if (totalDuration < 15) {
    throw new ApiError(400, "Service duration must be at least 15 minutes");
  }

  // Calculate endTime and validate slot
  const endTime = addMinutesToTime(startTime, totalDuration);
  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();

  // Validate booking slot (date, time, staff, conflicts)
  const validationResult = await validateBookingSlot({
    shopSlug,
    date,
    startTime,
    durationMin: totalDuration,
    staffId,
  });

  // Appointment.staffId stores ShopStaff.id.

  const subtotal =
    services.reduce((sum, s) => sum + (s.basePrice ?? 0), 0) +
    optionValues.reduce((sum, ov) => sum + ov.price, 0) +
    packages.reduce((sum, p) => sum + p.basePrice, 0) +
    addons.reduce((sum, a) => sum + a.price, 0);

  let totalAmount = subtotal;
  let discountAmount = 0;

  if (promotionId) {
    [totalAmount, discountAmount] = await priceDiscountCalculate(
      subtotal,
      0,
      promotionId,
    );
  }

  const appointment = await db.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        shopId: shop.id,
        customerId,
        staffId: assignedStaffId,
        date: appointmentDate,
        startTime,
        endTime,
        status: shop.settings?.autoConfirm ? "CONFIRMED" : "PENDING",
        source: source ?? "APP",
        note: note ?? null,
        promotionId: promotionId ?? null,
        subtotal,
        discountAmount,
        totalAmount,
        services: {
          create: services.map((s) => {
            const serviceOptionData = serviceOptions?.find(
              (so) => so.serviceId === s.id,
            );
            const selectedOptionValues = serviceOptionData
              ? optionValues.filter((ov) =>
                  serviceOptionData.optionValueIds.includes(ov.id),
                )
              : [];

            return {
              serviceId: s.id,
              serviceName: s.name,
              priceAtBooking: s.basePrice ?? 0,
              durationMin: s.durationMin,
              selectedValues: {
                create: selectedOptionValues.map((ov) => ({
                  optionValueId: ov.id,
                  priceAtBooking: ov.price,
                })),
              },
            };
          }),
        },
        packages: {
          create: packages.map((p) => ({
            packageId: p.id,
            priceAtBooking: p.basePrice,
          })),
        },
        addons: {
          create: addons.map((a) => ({
            addonId: a.id,
            priceAtBooking: a.price,
          })),
        },
      },
      include: {
        services: {
          include: {
            selectedValues: true,
          },
        },
        packages: true,
        addons: {
          include: {
            addon: true,
          },
        },
        customer: true,
      },
    });

    const bookingAt = new Date();
    await tx.shopCustomer.upsert({
      where: {
        shopId_customerId: {
          shopId: shop.id,
          customerId,
        },
      },
      create: {
        shopId: shop.id,
        customerId,
        firstBookingAt: bookingAt,
        lastBookingAt: bookingAt,
        totalBookings: 1,
      },
      update: {
        lastBookingAt: bookingAt,
        totalBookings: { increment: 1 },
      },
    });

    return appointment;
  });

  await db.appointmentLifecycle.create({
    data: {
      appointmentId: appointment.id,
      shopId: shop.id,
      toStatus: appointment.status,
      changedById: customerId,
      reason: "Appointment created",
      metadata: {
        source: source ?? "APP",
        autoConfirmed: Boolean(shop.settings?.autoConfirm),
      },
    },
  });

  await db.auditLog.create({
    data: {
      shopId: shop.id,
      userId: customerId,
      action: "APPOINTMENT_CREATED",
      entity: "Appointment",
      entityId: appointment.id,
      changes: { toStatus: appointment.status },
    },
  });

  if (promotionId) {
    await incrementPromotionUsage(promotionId);
  }
  const managers = await db.shopStaff.findMany({
    where: { shopId: shop.id, OR: [{ role: "MANAGER" }, { role: "OWNER" }] },
  });
  console.log(managers);
  console.log("🔌 Connected sockets:", getIO().sockets.adapter.rooms);
  const notifications = await Promise.all(
    managers.map((m) =>
      db.notification.create({
        data: {
          title: "New appointment request",
          content: `${appointment?.customer.name} booked an appointment from ${appointment.startTime} to ${appointment.endTime} on ${appointmentDate}`,
          type: "OFF_DAY_REQUEST",
          channel: "PUSH",
          shopId: shop.id,
          userId: m.userId,
        },
      }),
    ),
  );
  getIO()
    .to(`shop:${shop.id}`)
    .emit("appointment_request", {
      appointmentId: appointment.id,
      message: `${appointment?.customer.name} booked an appointment from ${appointment.startTime} to ${appointment.endTime} on ${appointmentDate}`,
      notificationId: notifications[0].id,
    });
  return appointment;
};
export const getAppointmentsByShopId = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  return await db.appointment.findMany({
    where: {
      shopId: shop.id,
    },
    include: {
      services: {
        include: {
          selectedValues: true,
        },
      },
      packages: true,
      addons: {
        include: {
          addon: true,
        },
      },
    },
  });
};
export const getAppointmentsByDay = async (
  shopSlug: string,
  date: string,
  staffId?: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();
  const data = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      date: appointmentDate,
      ...(staffId ? { staffId } : {}),
    },
    include: {
      services: {
        include: {
          selectedValues: true,
        },
      },
      packages: true,
      addons: {
        include: {
          addon: true,
        },
      },
      customer: true,
    },
  });
  return data;
};

export const getAppointmentsByDayForUser = async (
  shopSlug: string,
  date: string,
  userId: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const staff = await db.shopStaff.findFirst({
    where: { shopId: shop.id, userId, isActive: true },
    select: { id: true },
  });
  if (!staff) return [];
  return getAppointmentsByDay(shopSlug, date, staff.id);
};

export interface UpdateAppointmentPatch {
  date?: string;
  startTime?: string;
  staffId?: string | null;
  note?: string | null;
  internalNote?: string | null;
}

export const updateAppointment = async (
  shopSlug: string,
  appointmentId: string,
  patch: UpdateAppointmentPatch,
  actorUserId: string,
  actorRole: ShopRole | undefined,
) => {
  assertManagerCanChangeStatus(actorRole);
  if (!actorUserId) throw new ApiError(401, "Unauthorized");

  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const current = await db.appointment.findFirst({
    where: { id: appointmentId, shopId: shop.id },
    include: {
      services: { select: { serviceId: true, durationMin: true } },
      packages: {
        select: {
          package: {
            select: {
              items: {
                where: { isIncluded: true },
                select: { serviceId: true },
              },
            },
          },
        },
      },
    },
  });
  if (!current) throw new ApiError(404, "Appointment not found");
  if (!["PENDING", "CONFIRMED"].includes(current.status)) {
    throw new ApiError(
      409,
      "Only pending or confirmed appointments can be updated",
    );
  }

  const currentDate = dayjs(current.date)
    .tz(shop.timezone)
    .format("YYYY-MM-DD");
  const nextDate = patch.date ?? currentDate;
  const nextStartTime = patch.startTime ?? current.startTime;
  const durationMin =
    timeToMinutes(current.endTime) - timeToMinutes(current.startTime);
  if (durationMin < 15) {
    throw new ApiError(400, "Appointment duration must be at least 15 minutes");
  }

  const currentStaff = current.staffId
    ? await db.shopStaff.findFirst({
        where: { id: current.staffId, shopId: shop.id, isActive: true },
        select: { id: true },
      })
    : null;
  if (current.staffId && !currentStaff) {
    throw new ApiError(404, "Assigned staff not found in this shop");
  }

  let nextStaffId: string | null | undefined = current.staffId;
  let nextShopStaffId = currentStaff?.id;
  if (patch.staffId !== undefined) {
    if (patch.staffId === null) {
      nextStaffId = null;
      nextShopStaffId = undefined;
    } else {
      const nextStaff = await db.shopStaff.findFirst({
        where: { id: patch.staffId, shopId: shop.id, isActive: true },
        select: { id: true, userId: true },
      });
      if (!nextStaff) throw new ApiError(404, "Staff not found in this shop");
      nextStaffId = nextStaff.id;
      nextShopStaffId = nextStaff.id;
    }
  }

  const requestedServiceIds = [
    ...new Set([
      ...current.services.map((service) => service.serviceId),
      ...current.packages.flatMap((item) =>
        item.package.items.map((service) => service.serviceId),
      ),
    ]),
  ];
  if (nextShopStaffId && requestedServiceIds.length > 0) {
    const assignedServices = await db.staffService.findMany({
      where: {
        shopStaffId: nextShopStaffId,
        serviceId: { in: requestedServiceIds },
        isActive: true,
        service: { shopId: shop.id, isActive: true },
      },
      select: { serviceId: true },
    });
    if (
      new Set(assignedServices.map((service) => service.serviceId)).size !==
      requestedServiceIds.length
    ) {
      throw new ApiError(
        400,
        "The selected staff member cannot perform one or more appointment services",
      );
    }
  }

  if (
    patch.date !== undefined ||
    patch.startTime !== undefined ||
    patch.staffId !== undefined
  ) {
    await validateBookingSlot({
      shopSlug,
      date: nextDate,
      startTime: nextStartTime,
      durationMin,
      staffId: nextShopStaffId,
    });
  }

  const nextEndTime = addMinutesToTime(nextStartTime, durationMin);
  const nextAppointmentDate = dayjs
    .tz(nextDate, shop.timezone)
    .startOf("day")
    .toDate();
  const patchMetadata = JSON.parse(
    JSON.stringify(patch),
  ) as Prisma.InputJsonObject;

  return db.$transaction(async (tx) => {
    const updateResult = await tx.appointment.updateMany({
      where: { id: current.id, shopId: shop.id, status: current.status },
      data: {
        date: nextAppointmentDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        staffId: nextStaffId,
        ...(patch.note !== undefined ? { note: patch.note } : {}),
        ...(patch.internalNote !== undefined
          ? { internalNote: patch.internalNote }
          : {}),
      },
    });
    if (updateResult.count !== 1) {
      throw new ApiError(409, "Appointment was changed by another request");
    }

    const updated = await tx.appointment.findUnique({
      where: { id: current.id },
    });
    if (!updated) throw new ApiError(404, "Appointment not found");

    await tx.appointmentLifecycle.create({
      data: {
        appointmentId: updated.id,
        shopId: shop.id,
        fromStatus: current.status,
        toStatus: current.status,
        changedById: actorUserId,
        reason: "Appointment details updated",
        metadata: patchMetadata,
      },
    });
    await tx.auditLog.create({
      data: {
        shopId: shop.id,
        userId: actorUserId,
        action: "APPOINTMENT_UPDATED",
        entity: "Appointment",
        entityId: updated.id,
        changes: patchMetadata,
      },
    });

    return updated;
  });
};

export const changeAppointmentStatus = async (
  shopSlug: string,
  appointmentId: string,
  status: string,
  actorUserId: string,
  actorRole: ShopRole | undefined,
  reason?: string,
  cancelReason?: string,
  internalNote?: string,
) => {
  assertManagerCanChangeStatus(actorRole);
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  if (!isAppointmentStatus(status) || status === "PENDING") {
    throw new ApiError(400, "Invalid appointment transition status");
  }

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  return await db.$transaction(async (tx) => {
    const current = await tx.appointment.findFirst({
      where: { id: appointmentId, shopId: shop.id },
      select: { id: true, shopId: true, status: true, cancelReason: true },
    });
    if (!current) throw new ApiError(404, "Appointment not found");

    const nextStatus = status as AppointmentStatus;
    if (!appointmentTransitions[current.status].includes(nextStatus)) {
      throw new ApiError(
        409,
        `Cannot change appointment status from ${current.status} to ${nextStatus}`,
      );
    }
    if (nextStatus === "CANCELLED" && !(cancelReason || reason)) {
      throw new ApiError(400, "Cancellation reason is required");
    }

    const now = new Date();
    const updateResult = await tx.appointment.updateMany({
      where: { id: current.id, shopId: current.shopId, status: current.status },
      data: {
        status: nextStatus,
        ...(nextStatus === "IN_PROGRESS" ? { checkedInAt: now } : {}),
        ...(nextStatus === "COMPLETED" ? { completedAt: now } : {}),
        ...(nextStatus === "CANCELLED"
          ? { cancelReason: cancelReason || reason }
          : {}),
        ...(internalNote !== undefined ? { internalNote } : {}),
      },
    });
    if (updateResult.count !== 1) {
      throw new ApiError(
        409,
        "Appointment status was changed by another request",
      );
    }

    const updated = await tx.appointment.findUnique({
      where: { id: current.id },
    });
    if (!updated) throw new ApiError(404, "Appointment not found");

    if (nextStatus === "COMPLETED") {
      const shopCustomer = await tx.shopCustomer.findUnique({
        where: {
          shopId_customerId: {
            shopId: updated.shopId,
            customerId: updated.customerId,
          },
        },
        select: { id: true, firstVisitAt: true },
      });

      if (shopCustomer) {
        await tx.shopCustomer.update({
          where: { id: shopCustomer.id },
          data: {
            ...(shopCustomer.firstVisitAt ? {} : { firstVisitAt: now }),
            lastVisitAt: now,
            totalVisits: { increment: 1 },
            totalSpent: { increment: updated.totalAmount },
          },
        });
      } else {
        await tx.shopCustomer.create({
          data: {
            shopId: updated.shopId,
            customerId: updated.customerId,
            firstBookingAt: updated.createdAt,
            lastBookingAt: updated.createdAt,
            firstVisitAt: now,
            lastVisitAt: now,
            totalBookings: 1,
            totalVisits: 1,
            totalSpent: updated.totalAmount,
          },
        });
      }
    }

    await tx.appointmentLifecycle.create({
      data: {
        appointmentId: current.id,
        shopId: current.shopId,
        fromStatus: current.status,
        toStatus: nextStatus,
        reason: reason || cancelReason || null,
        changedById: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        shopId: current.shopId,
        userId: actorUserId,
        action: "APPOINTMENT_STATUS_CHANGED",
        entity: "Appointment",
        entityId: current.id,
        changes: {
          fromStatus: current.status,
          toStatus: nextStatus,
          reason: reason || cancelReason || null,
        },
      },
    });

    return updated;
  });
};

export const getAppointmentLifecycle = async (
  shopSlug: string,
  appointmentId: string,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, shopId: shop.id },
    select: { id: true },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");

  return db.appointmentLifecycle.findMany({
    where: { appointmentId: appointment.id, shopId: shop.id },
    orderBy: { createdAt: "asc" },
    include: {
      changedBy: { select: { id: true, name: true } },
    },
  });
};
export const getIncomeByDayWeekly = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const now = dayjs.tz(new Date(), shop.timezone);
  const day = now.day();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = now.add(diffToMonday, "day").startOf("day").toDate();
  const end = dayjs.tz(start, shop.timezone).add(7, "day").toDate();

  const appointments = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      status: "COMPLETED",
      date: {
        gte: start,
        lt: end,
      },
    },
    select: {
      date: true,
      totalAmount: true,
    },
  });

  const incomeByDate: Record<string, number> = {};
  for (const { date, totalAmount } of appointments) {
    const key = dayjs(date).tz(shop.timezone).format("YYYY-MM-DD");
    incomeByDate[key] = (incomeByDate[key] ?? 0) + (totalAmount ?? 0);
  }
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs.tz(start, shop.timezone).add(i, "day");
    return {
      day: d.format("ddd"),
      date: d.format("DD"),
      income: incomeByDate[d.format("YYYY-MM-DD")] ?? 0,
    };
  });
  const weekRange = `${days[0].day} ${days[0].date} - ${days[6].day} ${days[6].date}`;
  const today = {
    fullDate: dayjs.tz(new Date(), shop.timezone).format("YYYY/MM/DD"),
    income:
      incomeByDate[dayjs.tz(new Date(), shop.timezone).format("YYYY-MM-DD")] ??
      0,
  };
  const weeklyTotal = days.reduce((sum, item) => sum + item.income, 0);
  return { weekRange, days, today, weeklyTotal };
};
export const markAllAppointmentsAsDone = async (
  shopSlug: string,
  actorUserId: string,
  actorRole: ShopRole | undefined,
) => {
  assertManagerCanChangeStatus(actorRole);
  if (!actorUserId) throw new ApiError(401, "Unauthorized");

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const appointments = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    select: { id: true, status: true },
  });

  for (const appointment of appointments) {
    await changeAppointmentStatus(
      shopSlug,
      appointment.id,
      "COMPLETED",
      actorUserId,
      actorRole,
      "Bulk completion by manager",
    );
  }

  return { count: appointments.length };
};
