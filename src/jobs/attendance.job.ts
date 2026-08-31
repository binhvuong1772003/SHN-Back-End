import cron from "node-cron";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { Prisma } from "@prisma/client";
import { db } from "@/db/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

type ShopWithHours = Prisma.ShopGetPayload<{
  include: { businessHours: true };
}>;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getBusinessDay = (shop: ShopWithHours, date: Dayjs) => {
  const dayOfWeek = date.day();
  const configured = shop.businessHours.find(
    (item) => item.dayOfWeek === dayOfWeek,
  );
  if (configured) {
    return {
      isClosed: configured.isClosed,
      closeTime: configured.closeTime,
      dayOfWeek,
    };
  }
  const workDays = shop.workDays.map((day) => (day === 7 ? 0 : day));
  return {
    isClosed: !workDays.includes(dayOfWeek),
    closeTime: shop.closeTime,
    dayOfWeek,
  };
};

const finalizeShopDate = async (shop: ShopWithHours, localDate: Dayjs) => {
  const businessDay = getBusinessDay(shop, localDate);
  if (businessDay.isClosed) return 0;

  const date = localDate.startOf("day").toDate();
  const end = localDate.endOf("day").toDate();
  const schedules = await db.staffSchedule.findMany({
    where: {
      dayOfWeek: businessDay.dayOfWeek,
      isOff: false,
      shopStaff: { shopId: shop.id, isActive: true },
    },
    select: { shopStaffId: true },
  });
  const staffIds = schedules.map((item) => item.shopStaffId);
  if (staffIds.length === 0) return 0;

  const approvedOffDays = await db.staffOffDay.findMany({
    where: {
      shopStaffId: { in: staffIds },
      status: "APPROVED",
      OR: [
        { offDate: { gte: date, lte: end }, offDateEnd: null },
        { offDate: { lte: end }, offDateEnd: { gte: date } },
      ],
    },
    select: { shopStaffId: true },
  });
  const offStaffIds = new Set(
    approvedOffDays.map((item) => item.shopStaffId),
  );

  let absentCount = 0;
  for (const staffId of staffIds) {
    if (offStaffIds.has(staffId)) continue;
    const attendance = await db.attendance.findUnique({
      where: { shopStaffId_date: { shopStaffId: staffId, date } },
    });
    if (attendance?.checkIn) continue;
    if (attendance?.status === "ABSENT") continue;

    if (attendance) {
      await db.attendance.update({
        where: { id: attendance.id },
        data: { status: "ABSENT" },
      });
    } else {
      await db.attendance.create({
        data: { shopStaffId: staffId, date, status: "ABSENT" },
      });
    }
    absentCount += 1;
  }
  return absentCount;
};

export const finalizeAttendance = async () => {
  const shops = await db.shop.findMany({
    where: { status: "ACTIVE" },
    include: { businessHours: true },
  });

  let total = 0;
  for (const shop of shops) {
    const now = dayjs().tz(shop.timezone);
    total += await finalizeShopDate(shop, now.subtract(1, "day"));

    const businessDay = getBusinessDay(shop, now);
    const currentMinutes = now.hour() * 60 + now.minute();
    if (
      !businessDay.isClosed &&
      currentMinutes >= timeToMinutes(businessDay.closeTime)
    ) {
      total += await finalizeShopDate(shop, now);
    }
  }
  console.log(`[Attendance] Marked ${total} records as ABSENT`);
};

cron.schedule("*/15 * * * *", () => {
  void finalizeAttendance().catch((error) => {
    console.error("[Attendance] Finalizer failed:", error);
  });
});
