import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import { CreateAppointmentInput } from "@/validation/appointment";
import { validateBookingSlot } from "@/service/calendar/calendar.service";
import { addMinutesToTime } from "@/helper/slot.helper";
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
export const createAppointment = async (
  data: CreateAppointmentInput,
  customerId: string,
  shopSlug: string,
) => {
  if (!customerId) throw new ApiError(401, "Unauthorized");
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
    throw new ApiError(404, "Một số dịch vụ không tồn tại hoặc không khả dụng");
  }
  if (packageIds?.length && packages.length !== packageIds.length) {
    throw new ApiError(
      404,
      "Một số gói dịch vụ không tồn tại hoặc không khả dụng",
    );
  }
  if (addonIds?.length && addons.length !== addonIds.length) {
    throw new ApiError(
      404,
      "Một số dịch vụ thêm không tồn tại hoặc không khả dụng",
    );
  }

  if (services.length === 0 && packages.length === 0) {
    throw new ApiError(400, "Phải chọn ít nhất một dịch vụ hoặc gói dịch vụ");
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
          `Dịch vụ "${service.name}" yêu cầu chọn tùy chọn`,
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
    throw new ApiError(400, "Thời gian dịch vụ phải ít nhất 15 phút");
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

  // Get userId from ShopStaff if staffId provided (because Appointment.staffId references User.id)
  // let assignedUserId: string | null = null;
  // if (staffId) {
  //   const shopStaff = await db.shopStaff.findFirst({
  //     where: { id: staffId, shopId: shop.id, isActive: true },
  //   });
  //   if (!shopStaff) {
  //     throw new ApiError(404, "Staff không tồn tại");
  //   }
  //   assignedUserId = shopStaff.userId;
  // }

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

  const appointment = await db.appointment.create({
    data: {
      shopId: shop.id,
      customerId,
      staffId: staffId,
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
          title: "Yêu cầu nghỉ",
          content: `${appointment?.customer.name} đã đặt lịch từ từ ${appointment.startTime} đến ${appointment.endTime} ngày ${appointmentDate}`,
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
      message: `${appointment?.customer.name} đã đặt lịch từ từ ${appointment.startTime} đến ${appointment.endTime} ngày ${appointmentDate}`,
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
export const getAppointmentsByDay = async (shopSlug: string, date: string, staffUserId?: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();
  const data = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      date: appointmentDate,
      ...(staffUserId ? { staffId: staffUserId } : {}),
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
  console.log(data);
  return data;
};
export const changeAppointmentStatus = async (
  shopSlug: string,
  appointmentId: string,
  status: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  return await db.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: status as any,
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
      status: "DONE",
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
export const markAllAppointmentsAsDone = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const result = await db.appointment.updateMany({
    where: { shopId: shop.id },
    data: { status: "DONE" },
  });
  return result;
};
