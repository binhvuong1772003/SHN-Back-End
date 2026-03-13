import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { OffDayStatus } from '@prisma/client';
import {
  RequestOffDayInput,
  ResponseOffDayInput,
} from '@/validation/staff.validate';
import { getIO } from '@/socket';
export const requestOffDayService = async (
  shopSlug: string,
  staffId: string,
  data: RequestOffDayInput
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const staff = await db.shopStaff.findUnique({
    where: { id: staffId },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
  if (!shop) throw new ApiError(404, 'Staff không tồn tại');
  const managers = await db.shopStaff.findMany({
    where: { shopId: shop.id, OR: [{ role: 'MANAGER' }, { role: 'OWNER' }] },
  });
  console.log(managers);
  const offDay = await db.staffOffDay.create({
    data: {
      ...data,
      shopStaffId: staffId,
      status: OffDayStatus.PENDING,
    },
  });
  const dateMessage = offDay.offDateEnd
    ? `từ ${offDay.offDate.toLocaleDateString()} đến ${offDay.offDateEnd.toLocaleDateString()}`
    : `ngày ${offDay.offDate.toLocaleDateString()}`;
  const rooms = managers.map((m) => m.id);
  console.log('🔔 Emitting to rooms:', rooms);
  console.log('🔌 Connected sockets:', getIO().sockets.adapter.rooms);

  getIO()
    .to(managers.map((m) => m.id))
    .emit('off_day_request', {
      offDayId: offDay.id,
      message: `${staff?.user.name} xin nghỉ ${dateMessage}`,
    });
  return offDay;
};
export const responseOffDayService = async (
  offDayId: string,
  data: ResponseOffDayInput
) => {
  const result = await db.staffOffDay.update({
    where: { id: offDayId },
    data,
  });
  const message =
    data.status === 'APPROVED'
      ? 'Đơn xin nghỉ được duyệt'
      : `Đơn xin nghỉ bị từ chối. Lí do: ${data.rejectReason}`;
  getIO().to(result.shopStaffId).emit('off_day_response', {
    offDayId: result.id,
    status: data.status,
    message,
  });
  return result;
};
export const getListOffDayService = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const result = await db.staffOffDay.findMany({
    where: { shopStaff: { shopId: shop.id } },
    include: { shopStaff: { include: { user: { select: { name: true } } } } },
  });
  return result;
};
export const getDetailOffDayService = async (offDayId: string) => {
  const result = await db.staffOffDay.findUnique({
    where: { id: offDayId },
    include: {
      shopStaff: {
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!result) throw new ApiError(404, 'Không tìm thấy đơn xin nghỉ');
  return result;
};
