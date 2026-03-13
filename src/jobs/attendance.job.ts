import cron from 'node-cron';
import { db } from '@/db/prisma';

export const createDailyAttendance = async () => {
  console.log('⏰ Tạo record chấm công...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allStaff = await db.shopStaff.findMany({
    where: { isActive: true },
  });

  for (const staff of allStaff) {
    const approvedOffDay = await db.staffOffDay.findFirst({
      where: {
        shopStaffId: staff.id,
        status: 'APPROVED',
        offDate: { lte: today },
        OR: [
          { offDateEnd: null, offDate: today },
          { offDateEnd: { gte: today } },
        ],
      },
    });

    const existing = await db.attendance.findUnique({
      where: {
        shopStaffId_date: {
          shopStaffId: staff.id,
          date: today,
        },
      },
    });

    if (existing) continue;

    await db.attendance.create({
      data: {
        shopStaffId: staff.id,
        date: today,
        status: approvedOffDay ? 'DAY_OFF_APPROVED' : 'ABSENT',
      },
    });
  }

  console.log(`✅ Tạo xong record cho ${allStaff.length} staff`);
};

cron.schedule('0 0 * * *', createDailyAttendance);
