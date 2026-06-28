// helpers/slot.helper.ts
import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
export const getBusyAppointments = async (
  shopId: string,
  date: Date,
  staffId?: string
) => {
  return db.appointment.findMany({
    where: {
      shopId,
      date,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      ...(staffId && { staffId }),
    },
    select: { startTime: true, endTime: true, staffId: true },
  });
};

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const addMinutesToTime = (time: string, minutes: number) => {
  return minutesToTime(timeToMinutes(time) + minutes);
};

export const generateSlots = (
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  durationMin: number
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
  date: Date
): Promise<{ available: boolean; reason?: string }> => {
  const dayOfWeek = date.getDay();

  const staff = await db.shopStaff.findFirst({
    where: { shopId, userId: staffId, isActive: true },
  });
  if (!staff) return { available: false, reason: 'Staff không tồn tại' };

  // Check lịch làm việc theo thứ
  const schedule = await db.staffSchedule.findFirst({
    where: { shopStaffId: staff.id, dayOfWeek },
  });
  if (!schedule || schedule.isOff) {
    return { available: false, reason: 'Staff không làm ngày này' };
  }

  // Check off day được duyệt
  const offDay = await db.staffOffDay.findFirst({
    where: {
      shopStaffId: staff.id,
      status: 'APPROVED',
      offDate: { lte: date },
      OR: [{ offDateEnd: null, offDate: date }, { offDateEnd: { gte: date } }],
    },
  });
  if (offDay) return { available: false, reason: 'Staff đang nghỉ phép' };

  return { available: true };
};
export const filterAvailableSlots = (
  allSlots: string[],
  busyAppointments: { startTime: string; endTime: string }[],
  durationMin: number
) => {
  return allSlots.filter((slotStart) => {
    const slotEnd = addMinutesToTime(slotStart, durationMin);
    return !busyAppointments.some(
      (appt) => slotStart < appt.endTime && slotEnd > appt.startTime
    );
  });
};

export const checkSlotAvailability = async (
  shopId: string,
  date: Date,
  startTime: string,
  endTime: string,
  staffId?: string
): Promise<{ available: boolean; reason?: string }> => {
  const conflict = await db.appointment.findFirst({
    where: {
      shopId,
      date,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      ...(staffId && { staffId }),
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (conflict) {
    return {
      available: false,
      reason: 'Slot này đã có người đặt, vui lòng chọn giờ khác',
    };
  }

  return { available: true };
};
