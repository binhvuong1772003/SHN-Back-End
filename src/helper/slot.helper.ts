// helpers/slot.helper.ts
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
export const getBusyAppointments = async (
  shopId: string,
  date: Date,
  staffId?: string,
) => {
  // Convert ShopStaff.id to userId if staffId provided (Appointment.staffId references User.id)
  let userId: string | undefined = undefined;
  if (staffId) {
    const shopStaff = await db.shopStaff.findFirst({
      where: { id: staffId, shopId, isActive: true },
    });
    if (shopStaff) {
      userId = shopStaff.userId;
    }
  }

  return db.appointment.findMany({
    where: {
      shopId,
      date,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(userId && { staffId: userId }),
    },
    select: { startTime: true, endTime: true, staffId: true },
  });
};

export const getAppointmentsWithGridPosition = async (
  shopId: string,
  date: Date,
  timeSlots: string[],
) => {
  const appointments = await db.appointment.findMany({
    where: {
      shopId,
      date,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      staffId: true,
      status: true,
      customer: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      services: {
        select: {
          serviceName: true,
        },
      },
    },
  });
  const getGridRowEnd = (endTime: string) => {
    const index = timeSlots.findIndex((slot) => slot >= endTime);

    return index !== -1 ? index + 1 : timeSlots.length + 1;
  };
  const newAppointments = appointments.map((apt) => {
    // Tìm index của startTime và endTime trong timeSlots array
    const gridRowStart = timeSlots.indexOf(apt.startTime) + 1; // +1 vì grid row bắt đầu từ 1
    const gridRowEnd = getGridRowEnd(apt.endTime);

    return {
      ...apt,
      gridRowStart,
      gridRowEnd,
    };
  });
  return newAppointments;
};

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const addMinutesToTime = (time: string, minutes: number) => {
  return minutesToTime(timeToMinutes(time) + minutes);
};

export const generateSlots = (
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  durationMin: number,
) => {
  const slots: string[] = [];
  let current = timeToMinutes(openTime);
  const end = timeToMinutes(closeTime);
  while (current + durationMin <= end) {
    slots.push(minutesToTime(current));
    current += intervalMinutes;
  }
  return slots;
};

export const isStaffAvailable = async (
  staffId: string,
  shopId: string,
  dayOfWeek: number,
  date: Date,
): Promise<{ available: boolean; reason?: string }> => {
  const staff = await db.shopStaff.findFirst({
    where: { shopId, id: staffId, isActive: true },
  });
  if (!staff) return { available: false, reason: "Staff không tồn tại" };

  // Check lịch làm việc theo thứ
  const schedule = await db.staffSchedule.findFirst({
    where: { shopStaffId: staff.id, dayOfWeek },
  });
  if (!schedule || schedule.isOff) {
    return { available: false, reason: "Staff không làm ngày này" };
  }

  // Check off day được duyệt
  const offDay = await db.staffOffDay.findFirst({
    where: {
      shopStaffId: staff.id,
      status: "APPROVED",
      offDate: { lte: date },
      OR: [{ offDateEnd: null, offDate: date }, { offDateEnd: { gte: date } }],
    },
  });
  if (offDay) return { available: false, reason: "Staff đang nghỉ phép" };

  return { available: true };
};
export const filterAvailableSlots = (
  allSlots: string[],
  busyAppointments: { startTime: string; endTime: string }[],
  durationMin: number,
) => {
  return allSlots.filter((slotStart) => {
    const slotEnd = addMinutesToTime(slotStart, durationMin);
    return !busyAppointments.some(
      (appt) => slotStart < appt.endTime && slotEnd > appt.startTime,
    );
  });
};

export const checkSlotAvailability = async (
  shopId: string,
  date: Date,
  startTime: string,
  endTime: string,
  staffId?: string,
): Promise<{ available: boolean; reason?: string }> => {
  // Convert ShopStaff.id to userId if staffId provided (Appointment.staffId references User.id)
  let userId: string | undefined = undefined;
  if (staffId) {
    const shopStaff = await db.shopStaff.findFirst({
      where: { id: staffId, shopId, isActive: true },
    });
    if (shopStaff) {
      userId = shopStaff.userId;
    }
  }

  const conflict = await db.appointment.findFirst({
    where: {
      shopId,
      date,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(userId && { staffId: userId }),
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (conflict) {
    return {
      available: false,
      reason: "Slot này đã có người đặt, vui lòng chọn giờ khác",
    };
  }

  return { available: true };
};
