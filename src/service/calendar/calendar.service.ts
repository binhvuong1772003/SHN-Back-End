import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  addMinutesToTime,
  generateSlots,
  getBusyAppointments,
  filterAvailableSlots,
  isStaffAvailable,
  checkSlotAvailability,
  timeToMinutes,
} from '@/helper/slot.helper';

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
  if (!shop) throw new ApiError(404, 'Shop not found');

  const endTime = addMinutesToTime(startTime, durationMin);
  const appointmentDate = new Date(date);
  appointmentDate.setHours(0, 0, 0, 0);

  // Validate business hours
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const [openHour, openMin] = shop.openTime.split(':').map(Number);
  const [closeHour, closeMin] = shop.closeTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw new ApiError(
      400,
      `Shop chỉ mở cửa từ ${shop.openTime} đến ${shop.closeTime}`
    );
  }

  // Validate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15)
  );

  if (appointmentDate < today) {
    throw new ApiError(400, 'Không thể đặt lịch trong quá khứ');
  }
  if (appointmentDate > maxDate) {
    throw new ApiError(
      400,
      `Chỉ đặt trước tối đa ${shop.settings?.maxAdvanceBookingDays ?? 15} ngày`
    );
  }

  // Validate work day
  const dayOfWeek = appointmentDate.getDay();
  if (!shop.workDays.includes(dayOfWeek)) {
    throw new ApiError(400, 'Shop không làm việc ngày này');
  }

  // Check staff availability
  if (staffId) {
    // Validate ObjectID format
    if (!/^[0-9a-fA-F]{24}$/.test(staffId)) {
      throw new ApiError(400, 'staffId không hợp lệ');
    }

    const { available, reason } = await isStaffAvailable(
      staffId,
      shop.id,
      appointmentDate
    );
    if (!available) {
      throw new ApiError(400, reason || 'Nhân viên không khả dụng');
    }
  }

  // Check slot availability
  const { available: slotAvailable, reason: slotReason } =
    await checkSlotAvailability(
      shop.id,
      appointmentDate,
      startTime,
      endTime,
      staffId
    );
  if (!slotAvailable) {
    throw new ApiError(409, slotReason || 'Slot không khả dụng');
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
  if (!shop) throw new ApiError(404, 'Shop not found');

  const appointmentDate = new Date(date);
  appointmentDate.setHours(0, 0, 0, 0);

  // Validate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15)
  );

  if (appointmentDate < today) {
    throw new ApiError(400, 'Không thể xem lịch trong quá khứ');
  }
  if (appointmentDate > maxDate) {
    throw new ApiError(
      400,
      `Chỉ xem lịch tối đa ${shop.settings?.maxAdvanceBookingDays ?? 15} ngày`
    );
  }

  // Check work day
  const dayOfWeek = appointmentDate.getDay();
  if (!shop.workDays.includes(dayOfWeek)) {
    return {
      date: appointmentDate,
      isWorkDay: false,
      slots: [],
      message: 'Shop không làm việc ngày này',
    };
  }

  // Check staff availability if staffId provided
  if (staffId) {
    const { available, reason } = await isStaffAvailable(
      staffId,
      shop.id,
      appointmentDate
    );
    if (!available) {
      return {
        date: appointmentDate,
        isWorkDay: true,
        staffAvailable: false,
        slots: [],
        message: reason || 'Nhân viên không khả dụng',
      };
    }
  }

  // Generate all possible slots
  const allSlots = generateSlots(
    shop.openTime,
    shop.closeTime,
    shop.settings?.slotIntervalMinutes ?? 15,
    durationMin
  );

  // Get busy appointments
  const busyAppointments = await getBusyAppointments(
    shop.id,
    appointmentDate,
    staffId
  );

  // Filter available slots
  const availableSlots = filterAvailableSlots(
    allSlots,
    busyAppointments,
    durationMin
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

export const getMonthAvailability = async (
  shopSlug: string,
  year: number,
  month: number,
  staffId?: string
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(
    maxDate.getDate() + (shop.settings?.maxAdvanceBookingDays ?? 15)
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
    const currentDate = new Date(year, month - 1, day);
    currentDate.setHours(0, 0, 0, 0);
    const dayOfWeek = currentDate.getDay();
    const isWorkDay = shop.workDays.includes(dayOfWeek);
    const isPast = currentDate < today;
    const isBeyondBookingLimit = currentDate > maxDate;

    let hasAvailability = false;

    if (isWorkDay && !isPast && !isBeyondBookingLimit) {
      if (staffId) {
        const { available } = await isStaffAvailable(
          staffId,
          shop.id,
          currentDate
        );
        hasAvailability = available;
      } else {
        hasAvailability = true;
      }
    }

    daysInMonth.push({
      date: currentDate.toISOString().split('T')[0],
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
