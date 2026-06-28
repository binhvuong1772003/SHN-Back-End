import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { CreateAppointmentInput } from '@/validation/appointment';
import { validateBookingSlot } from '@/service/calendar/calendar.service';
import { addMinutesToTime } from '@/helper/slot.helper';
import {
  priceDiscountCalculate,
  incrementPromotionUsage,
} from '@/helper/price.helper';
import dayjs from 'dayjs';
import { getIO } from '@/socket';
export const createAppointment = async (
  data: CreateAppointmentInput,
  customerId: string,
  shopSlug: string
) => {
  if (!customerId) throw new ApiError(401, 'Unauthorized');
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
  if (!shop) throw new ApiError(404, 'Shop not found');

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
    throw new ApiError(404, 'Một số dịch vụ không tồn tại hoặc không khả dụng');
  }
  if (packageIds?.length && packages.length !== packageIds.length) {
    throw new ApiError(
      404,
      'Một số gói dịch vụ không tồn tại hoặc không khả dụng'
    );
  }
  if (addonIds?.length && addons.length !== addonIds.length) {
    throw new ApiError(
      404,
      'Một số dịch vụ thêm không tồn tại hoặc không khả dụng'
    );
  }

  if (services.length === 0 && packages.length === 0) {
    throw new ApiError(400, 'Phải chọn ít nhất một dịch vụ hoặc gói dịch vụ');
  }

  // Validate required options are selected
  for (const service of services) {
    if (service.options && service.options.length > 0) {
      const serviceOptionData = serviceOptions?.find(
        (so) => so.serviceId === service.id
      );
      if (!serviceOptionData || serviceOptionData.optionValueIds.length === 0) {
        throw new ApiError(
          400,
          `Dịch vụ "${service.name}" yêu cầu chọn tùy chọn`
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
    0
  );

  // Add addon durations
  totalDuration += addons.reduce((sum, a) => sum + (a.duration ?? 0), 0);

  if (totalDuration < 15) {
    throw new ApiError(400, 'Thời gian dịch vụ phải ít nhất 15 phút');
  }

  // Calculate endTime and validate slot
  const endTime = addMinutesToTime(startTime, totalDuration);
  const appointmentDate = dayjs(date).startOf('day').toDate();

  // Validate booking slot (date, time, staff, conflicts)
  const validationResult = await validateBookingSlot({
    shopSlug,
    date,
    startTime,
    durationMin: totalDuration,
    staffId,
  });

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
      promotionId
    );
  }

  const appointment = await db.appointment.create({
    data: {
      shopId: shop.id,
      customerId,
      staffId: staffId ?? null,
      date: appointmentDate,
      startTime,
      endTime,
      status: shop.settings?.autoConfirm ? 'CONFIRMED' : 'PENDING',
      source: source ?? 'APP',
      note: note ?? null,
      promotionId: promotionId ?? null,
      subtotal,
      discountAmount,
      totalAmount,
      services: {
        create: services.map((s) => {
          const serviceOptionData = serviceOptions?.find(
            (so) => so.serviceId === s.id
          );
          const selectedOptionValues = serviceOptionData
            ? optionValues.filter((ov) =>
                serviceOptionData.optionValueIds.includes(ov.id)
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
    where: { shopId: shop.id, OR: [{ role: 'MANAGER' }, { role: 'OWNER' }] },
  });
  console.log(managers);
  console.log('🔌 Connected sockets:', getIO().sockets.adapter.rooms);
  const notifications = await Promise.all(
    managers.map((m) =>
      db.notification.create({
        data: {
          title: 'Yêu cầu nghỉ',
          content: `${appointment?.customer.name} đã đặt lịch từ từ ${appointment.startTime} đến ${appointment.endTime} ngày ${appointmentDate}`,
          type: 'OFF_DAY_REQUEST',
          channel: 'PUSH',
          shopId: shop.id,
          userId: m.userId,
        },
      })
    )
  );
  getIO()
    .to(`shop:${shop.id}`)
    .emit('appointment_request', {
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
  if (!shop) throw new ApiError(404, 'Shop not found');
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
export const getAppointmentsByDay = async (shopSlug: string, date: Date) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
  console.log(date);
  const data = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      date,
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
  status: string
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
  return await db.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: status as any,
    },
  });
};
