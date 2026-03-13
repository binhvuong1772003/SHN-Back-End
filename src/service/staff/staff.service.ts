import { db } from '@/db/prisma';
import { transporter } from '@/utils/mailer';
import crypto from 'crypto';
import { hashToken, getExpiresAt } from '@/utils/jwt';
import { ShopRole } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const inviteStaffService = async (
  shopSlug: string,
  invitedEmail: string,
  role: ShopRole,
  invitedBy: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const existingUser = await db.user.findUnique({
    where: { email: invitedEmail },
  });
  if (existingUser) {
    const alreadyStaff = await db.shopStaff.findFirst({
      where: { shopId: shop.id, userId: existingUser.id, isActive: true },
    });
    if (alreadyStaff)
      throw new ApiError(400, 'Email này đã là nhân viên của shop');
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  await db.shopInvite.create({
    data: {
      shopId: shop.id,
      email: invitedEmail,
      role: role,
      token: hashToken(rawToken),
      expiresAt: getExpiresAt('1h'),
    },
  });
  const hasAccount = !!existingUser;
  const inviteURL = hasAccount
    ? `${FRONTEND_URL}/invite/accept?token=${rawToken}`
    : `${FRONTEND_URL}/register?token=${rawToken}&email=${invitedEmail}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: invitedEmail,
    subject: `Bạn được mời tham gia ${shop.name}`,
    html: `
      <h2>Lời mời tham gia ${shop.name}</h2>
      <p>Vai trò: <strong>${role}</strong></p>
      <a href="${inviteURL}">Chấp nhận lời mời</a>
      <p>Link hết hạn sau 7 ngày</p>
    `,
  });
  return { message: 'Invitation sent successfully' };
};
export const acceptInviteService = async (rawToken: string, userId: string) => {
  const invite = await db.shopInvite.findUnique({
    where: { token: hashToken(rawToken) },
    include: { shop: true },
  });
  if (!invite) throw new ApiError(404, 'Lời mời không tồn tại');
  if (invite.expiresAt < new Date())
    throw new ApiError(400, 'Lời mời đã hết hạn');
  if (invite.isUsed) throw new ApiError(400, 'Lời mời đã được sử dụng');
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User không tồn tại');
  if (user.email !== invite.email) throw new ApiError(400, 'Email không khớp');
  await db.shopStaff.create({
    data: {
      shopId: invite.shopId,
      userId: user.id,
      role: invite.role,
      schedule: {
        create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          isOff: false,
        })),
      },
    },
  });
  await db.user.update({
    where: { id: userId },
    data: { role: 'SHOP_MEMBER' },
  });
  await db.shopInvite.update({
    where: { id: invite.id },
    data: { isUsed: true },
  });
  return {
    message: `Đã tham gia ${invite.shop.name} với vai trò ${invite.role}`,
  };
};
export const updateStaffInfoService = async (
  shopSlug: string,
  staffId: string,
  data: { role: ShopRole; isActive: boolean }
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  if (data.role && !Object.values(ShopRole).includes(data.role)) {
    throw new ApiError(400, `Role không hợp lệ: ${data.role}`);
  }
  return db.shopStaff.update({
    where: { id: staffId },
    data,
  });
};
export const updateStaffScheduleService = async (
  shopSlug: string,
  staffId: string,
  data: {
    schedule: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOff: boolean;
    }[];
  }
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  return db.staffSchedule.updateMany({
    where: { shopStaffId: staffId },
    data,
  });
};
