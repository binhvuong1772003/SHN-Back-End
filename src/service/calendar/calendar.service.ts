import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import {
  addMinutesToTime,
  generateSlots,
  getBusyAppointments,
  filterAvailableSlots,
  isStaffAvailable,
  checkSlotAvailability,
  timeToMinutes,
} from "@/helper/slot.helper";

interface ValidateBookingSlotInput {
  shopSlug: string;
  date: string;
  startTime: string;
  durationMin: number;
  staffId?: string;
}

interface GetAvailableSlotsInput {
  shopSlug: string;
  date: string;
  durationMin: number;
  staffId?: string;
}

export const validateBookingSlot = async (input: ValidateBookingSlotInput) => {
  const { shopSlug, date, startTime, durationMin, staffId } = input;

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const endTime = addMinutesToTime(startTime, durationMin);
  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();

  // Validate business hours
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const [openHour, openMin] = shop.openTime.split(":").map(Number);
  const [closeHour, closeMin] = shop.closeTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw new ApiError(
      400,
      `Shop is open only from ${shop.openTime} to ${shop.closeTime}`,
    );
  }

  // Validate date range
  const today = dayjs.tz(new Date(), shop.timezone).startOf("day").toDate();
  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15),
  );

  if (appointmentDate < today) {
    throw new ApiError(400, "Appointments cannot be booked in the past");
  }
  if (appointmentDate > maxDate) {
    throw new ApiError(
      400,
      `Appointments can only be booked up to ${shop.settings?.maxAdvanceBookingDays ?? 15} days in advance`,
    );
  }

  // Validate work day
  const dayOfWeek = dayjs.tz(date, shop.timezone).day();
  if (!shop.workDays.map((d) => (d === 7 ? 0 : d)).includes(dayOfWeek)) {
    throw new ApiError(400, "The shop is closed on this day");
  }

  // Check staff availability
  if (staffId) {
    // Validate ObjectID format
    if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
      throw new ApiError(400, "Invalid staffId");
    }

    const { available, reason } = await isStaffAvailable(
      staffId,
      shop.id,
      dayOfWeek,
      appointmentDate,
    );
    if (!available) {
    throw new ApiError(400, reason || "Staff is unavailable");
    }
  }

  // Check slot availability
  const { available: slotAvailable, reason: slotReason } =
    await checkSlotAvailability(
      shop.id,
      appointmentDate,
      startTime,
      endTime,
      staffId,
    );
  if (!slotAvailable) {
    throw new ApiError(409, slotReason || "Slot is unavailable");
  }

  return {
    valid: true,
    shop,
    appointmentDate,
    endTime,
  };
};

export const getAvailableSlots = async (input: GetAvailableSlotsInput) => {
  const { shopSlug, date, durationMin, staffId } = input;

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();

  // Validate date range
  const today = dayjs.tz(new Date(), shop.timezone).startOf("day").toDate();
  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15),
  );

  if (appointmentDate < today) {
    throw new ApiError(400, "Past availability cannot be viewed");
  }
  if (appointmentDate > maxDate) {
    throw new ApiError(
      400,
      `Availability can only be viewed up to ${shop.settings?.maxAdvanceBookingDays ?? 15} days in advance`,
    );
  }

  // Check work day
  const dayOfWeek = dayjs.tz(date, shop.timezone).day();
  if (!shop.workDays.map((d) => (d === 7 ? 0 : d)).includes(dayOfWeek)) {
    return {
      date: appointmentDate,
      isWorkDay: false,
      slots: [],
      message: "The shop is closed on this day",
    };
  }

  // Check staff availability if staffId provided
  if (staffId) {
    const { available, reason } = await isStaffAvailable(
      staffId,
      shop.id,
      dayOfWeek,
      appointmentDate,
    );
    if (!available) {
      return {
        date: appointmentDate,
        isWorkDay: true,
        staffAvailable: false,
        slots: [],
        message: reason || "Staff is unavailable",
      };
    }
  }

  // Generate all possible slots
  const allSlots = generateSlots(
    shop.openTime,
    shop.closeTime,
    shop.settings?.slotIntervalMinutes ?? 15,
    durationMin,
  );

  // Get busy appointments
  const busyAppointments = await getBusyAppointments(
    shop.id,
    appointmentDate,
    staffId,
  );

  // Filter available slots
  const availableSlots = filterAvailableSlots(
    allSlots,
    busyAppointments,
    durationMin,
  );

  return {
    date: appointmentDate,
    isWorkDay: true,
    staffAvailable: staffId ? true : undefined,
    openTime: shop.openTime,
    closeTime: shop.closeTime,
    slotInterval: shop.settings?.slotIntervalMinutes ?? 15,
    totalSlots: allSlots.length,
    availableSlots,
    busySlots: allSlots.length - availableSlots.length,
  };
};

export const getAllSlots = async (
  shopSlug: string,
  date: string,
  durationMin: number,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();

  // Validate date range
  const today = dayjs.tz(new Date(), shop.timezone).startOf("day").toDate();
  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15),
  );

  if (appointmentDate < today) {
    throw new ApiError(400, "Past availability cannot be viewed");
  }
  if (appointmentDate > maxDate) {
    throw new ApiError(
      400,
      `Availability can only be viewed up to ${shop.settings?.maxAdvanceBookingDays ?? 15} days in advance`,
    );
  }

  // Check work day
  const dayOfWeek = dayjs.tz(date, shop.timezone).day();
  if (!shop.workDays.map((d) => (d === 7 ? 0 : d)).includes(dayOfWeek)) {
    return {
      date: appointmentDate,
      isWorkDay: false,
      slots: [],
      message: "The shop is closed on this day",
    };
  }

  // Generate all possible slots
  const allSlots = generateSlots(
    shop.openTime,
    shop.closeTime,
    shop.settings?.slotIntervalMinutes ?? 15,
    durationMin,
  );

  return {
    date: appointmentDate,
    isWorkDay: true,
    openTime: shop.openTime,
    closeTime: shop.closeTime,
    slotInterval: shop.settings?.slotIntervalMinutes ?? 15,
    slots: allSlots,
    totalSlots: allSlots.length,
  };
};

export const getTimeSlots = async (shopSlug: string, date: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const appointmentDate = dayjs.tz(date, shop.timezone).startOf("day").toDate();

  // Check work day
  const dayOfWeek = dayjs.tz(date, shop.timezone).day();
  if (!shop.workDays.map((d) => (d === 7 ? 0 : d)).includes(dayOfWeek)) {
    return {
      date: appointmentDate,
      isWorkDay: false,
      slots: [],
      message: "The shop is closed on this day",
    };
  }

  // Generate all time slots based on interval only (for UI rendering)
  const intervalMinutes = shop.settings?.slotIntervalMinutes ?? 15;
  const slots: string[] = [];
  let current = timeToMinutes(shop.openTime);
  const end = timeToMinutes(shop.closeTime);

  while (current < end) {
    const hours = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (current % 60).toString().padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    current += intervalMinutes;
  }

  return {
    date: appointmentDate,
    isWorkDay: true,
    openTime: shop.openTime,
    closeTime: shop.closeTime,
    slotInterval: intervalMinutes,
    slots,
    totalSlots: slots.length,
  };
};

export const getAppointmentsWithSlots = async (
  shopSlug: string,
  date: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    include: {
      businessHours: true,
    },
  });

  if (!shop) {
    throw new ApiError(404, "Shop not found");
  }

  const selectedDate = dayjs.tz(date, shop.timezone);

  if (!selectedDate.isValid()) {
    throw new ApiError(400, "Invalid date");
  }

  const appointmentDate = selectedDate.startOf("day").toDate();
  const dayOfWeek = selectedDate.day();

  const businessHour = shop.businessHours.find(
    (item) => item.dayOfWeek === dayOfWeek,
  );

  if (!businessHour || businessHour.isClosed) {
    return {
      date: appointmentDate,
      timezone: shop.timezone,
      isWorkDay: false,
      schedule: null,
      appointments: [],
      message: "The shop is closed on this day",
    };
  }

  const appointments = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      date: appointmentDate,
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
      },
    },
    include: {
      services: {
        include: {
          selectedValues: {
            include: {
              optionValue: {
                include: {
                  option: true,
                },
              },
            },
          },
        },
      },
      packages: {
        include: {
          package: {
            include: {
              items: {
                include: {
                  service: true,
                  optionValue: {
                    include: {
                      option: true,
                    },
                  },
                },
              },
            },
          },
          addons: {
            include: {
              addon: true,
            },
          },
        },
      },
      addons: {
        include: {
          addon: true,
        },
      },
      customer: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return {
    date: appointmentDate,
    timezone: shop.timezone,
    isWorkDay: true,
    schedule: {
      openTime: businessHour.openTime,
      closeTime: businessHour.closeTime,
    },
    appointments,
  };
};

export const getMonthAvailability = async (
  shopSlug: string,
  year: number,
  month: number,
  staffId?: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const today = dayjs.tz(new Date(), shop.timezone).startOf("day").toDate();

  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15),
  );

  const daysInMonth: {
    date: string;
    dayOfWeek: number;
    isWorkDay: boolean;
    isPast: boolean;
    isBeyondBookingLimit: boolean;
    hasAvailability: boolean;
  }[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = dayjs.tz(dateStr, shop.timezone);
    const currentDate = d.startOf("day").toDate();
    const dayOfWeek = d.day();
    const isWorkDay = shop.workDays
      .map((d) => (d === 7 ? 0 : d))
      .includes(dayOfWeek);
    const isPast = currentDate < today;
    const isBeyondBookingLimit = currentDate > maxDate;

    let hasAvailability = false;

    if (isWorkDay && !isPast && !isBeyondBookingLimit) {
      if (staffId) {
        const { available } = await isStaffAvailable(
          staffId,
          shop.id,
          dayOfWeek,
          currentDate,
        );
        hasAvailability = available;
      } else {
        hasAvailability = true;
      }
    }

    daysInMonth.push({
      date: d.format("YYYY-MM-DD"),
      dayOfWeek,
      isWorkDay,
      isPast,
      isBeyondBookingLimit,
      hasAvailability,
    });
  }

  return {
    year,
    month,
    shopName: shop.name,
    workDays: shop.workDays,
    maxAdvanceBookingDays: shop.settings?.maxAdvanceBookingDays ?? 15,
    days: daysInMonth,
  };
};
