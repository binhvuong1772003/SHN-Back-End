import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import crypto from 'crypto';
import { setUncaughtExceptionCaptureCallback } from 'process';
export const generateDailyToken = async (shopId: string): Promise<string> => {
  const today = new Date().toISOString().split('T')[0];
  return crypto
    .createHmac('sha256', process.env.QR_SECRET!)
    .update(`${shopId}:${today}`)
    .digest('hex');
};
export const generateCheckInQRService = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const QRCode = await import('qrcode');
  const token = await generateDailyToken(shop.id);
  const url = `${process.env.FRONTEND_URL}/${shopSlug}/check-in?token=${token}`;
  return QRCode.default.toDataURL(url);
};

export const generateCheckOutQRService = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const QRCode = await import('qrcode');
  const token = await generateDailyToken(shop.id);
  const url = `${process.env.FRONTEND_URL}/${shopSlug}/check-out?token=${token}`;
  return QRCode.default.toDataURL(url);
};
export const qrCheckInService = async (
  token: string,
  shopSlug: string,
  userId: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  // Verify token có đúng ngày hôm nay không
  const expectedToken = await generateDailyToken(shop.id);
  if (token !== expectedToken)
    throw new ApiError(400, 'QR không hợp lệ hoặc đã hết hạn');

  // Gọi lại checkInService như bình thường
  return checkInService(userId, shopSlug);
};
export const qrCheckOutService = async (
  token: string,
  shopSlug: string,
  userId: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const expectedToken = await generateDailyToken(shop.id);
  if (token !== expectedToken)
    throw new ApiError(400, 'QR không hợp lệ hoặc đã hết hạn');

  return checkOutService(userId, shopSlug);
};
export const checkInService = async (userId: string, shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const staff = await db.shopStaff.findFirst({
    where: { userId, shopId: shop.id, isActive: true },
  });
  if (!staff) throw new ApiError(404, 'Không tìm thấy staff');
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendance = await db.attendance.findUnique({
    where: {
      shopStaffId_date: {
        shopStaffId: staff.id,
        date: today,
      },
    },
  });
  if (!attendance) throw new ApiError(404, 'Attendance không tồn tại');
  if (attendance.checkIn) throw new ApiError(400, 'Checked in rồi');
  const dayOfWeek = now.getDay();
  const schedule = await db.staffSchedule.findFirst({
    where: { shopStaffId: staff.id, dayOfWeek },
  });
  let lateMinutes = 0;
  let status = attendance.status;
  if (schedule) {
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const scheduledStart = new Date(today);
    scheduledStart.setHours(startHour, startMin, 0, 0);
    if (now > scheduledStart) {
      lateMinutes = Math.floor(
        (now.getTime() - scheduledStart.getTime()) / (1000 * 60)
      );
      status = 'LATE';
    } else {
      status = 'PRESENT';
    }
  }
  return await db.attendance.update({
    where: { id: attendance.id },
    data: { checkIn: now, lateMinutes, status },
  });
};
export const checkOutService = async (userId: string, shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const staff = await db.shopStaff.findFirst({
    where: { userId, shopId: shop.id, isActive: true },
  });
  if (!staff) throw new ApiError(404, 'Không tìm thấy staff');
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendance = await db.attendance.findUnique({
    where: {
      shopStaffId_date: {
        shopStaffId: staff.id,
        date: today,
      },
    },
  });
  if (!attendance) throw new ApiError(404, 'Attendance không tồn tại');
  if (!attendance.checkIn) throw new ApiError(400, 'Chưa check in');
  if (attendance.checkOut) throw new ApiError(400, 'Checked out rồi');
  const checkOutTime = new Date();
  const workedHours =
    (checkOutTime.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
  return await db.attendance.update({
    where: { id: attendance.id },
    data: { checkOut: checkOutTime, workHours: Math.floor(workedHours) },
  });
};
