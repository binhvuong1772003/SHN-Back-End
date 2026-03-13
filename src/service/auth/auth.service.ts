import {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  getExpiresAt,
} from '@/utils/jwt';
import { UserRole } from '@prisma/client';
import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { transporter } from '@/utils/mailer';
import { email } from 'zod';
import { hashPassword } from '@/utils/hash';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export const issueTokens = async (
  userId: string,
  role: UserRole,
  meta: { deviceInfo?: string; ipAddress?: string }
): Promise<AuthTokens> => {
  const accessToken = signAccessToken({ userId, role });
  const rawRefreshToken = generateOpaqueToken();

  await db.refreshToken.create({
    data: {
      userId: userId,
      tokenHash: hashToken(rawRefreshToken),
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt: getExpiresAt(REFRESH_EXPIRES),
    },
  });
  return { accessToken, refreshToken: rawRefreshToken };
};
export const registerWithMailService = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const existing = await db.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    if (!existing.isVerified) {
      throw new ApiError(409, 'Email already registered but not verified');
    }
    throw new ApiError(400, 'User Already Exists');
  }
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: 'CUSTOMER',
      isVerified: false,
    },
  });
  await sendVerificationEmailService(user.id, user.email);
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};
export const sendVerificationEmailService = async (
  userId: string,
  email: string
) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await db.emailVerification.create({
    data: {
      userId,
      token: hashToken(rawToken),
      expiresAt: getExpiresAt('5m'),
    },
  });
  const verifyURL = `${FRONTEND_URL}/email/verify?token=${rawToken}`;
  await await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Email from TLOB',
    html: `
      <h2>Email Verification</h2>
      <p>Click link below to verify:</p>
      <a href="${verifyURL}">${verifyURL}</a>
    `,
  });
};
export const verifyEmailService = async (
  rawToken: string,
  meta: { deviceInfo?: string; ipAddress?: string }
): Promise<{ user: object; tokens: AuthTokens }> => {
  const record = await db.emailVerification.findUnique({
    where: { token: hashToken(rawToken) },
    include: { user: true },
  });
  if (!record) throw new ApiError(400, 'Link xác thực không hợp lệ');
  if (record.expiresAt < new Date())
    throw new ApiError(400, 'Link xác thực đã hết hạn');
  const user = await db.user.update({
    where: { id: record.userId },
    data: { isVerified: true },
  });
  const tokens = await issueTokens(user.id, user.role, meta);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, tokens };
};
export const resendVerificationEmail = async (email: string) => {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, 'Email không tồn tại');
  if (user.isVerified) throw new ApiError(400, 'Tài khoản đã được xác thực');
  await sendVerificationEmailService(user.id, user.email);
};
export const loginWithEmailService = async (
  email: string,
  password: string,
  meta: { deviceInfo?: string; ipAddress?: string }
): Promise<{ user: object; tokens: AuthTokens }> => {
  const user = await db.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user || !user.passwordHash)
    throw new ApiError(401, 'Email hoặc Password không chính xác');
  if (!user.isVerified) throw new ApiError(403, 'Tài khoản chưa được xác thực');
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isPasswordValid)
    throw new ApiError(401, 'Email hoặc Password không chính xác');
  const token = await issueTokens(user.id, user.role, meta);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, tokens: token };
};
export const logoutService = async (rawToken: string) => {
  await db.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(rawToken),
    },
    data: {
      isRevoked: true,
    },
  });
};
export const refreshTokenService = async (
  rawToken: string,
  meta: { deviceInfo?: string; ipAddress?: string }
): Promise<AuthTokens> => {
  const stored = await db.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!stored) throw new ApiError(401, 'Refresh token không hợp lệ');
  if (stored.isRevoked) {
    await db.refreshToken.updateMany({
      where: { userId: stored.userId },
      data: { isRevoked: true },
    });
    throw new ApiError(401, 'Phát hiện bất thường, vui lòng đăng nhập lại');
  }
  if (stored.expiresAt < new Date()) {
    await db.refreshToken.updateMany({
      where: {
        tokenHash: hashToken(rawToken),
      },
      data: {
        isRevoked: true,
      },
    });
    throw new ApiError(401, 'Token đã hết hạn');
  }

  await db.refreshToken.updateMany({
    where: {
      tokenHash: stored.tokenHash,
    },
    data: {
      isRevoked: true,
    },
  });
  const user = await db.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw new ApiError(401, 'Người dùng không tồn tại');
  const newToken = await issueTokens(stored.userId, user.role, meta);
  return newToken;
};
export const getMeService = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
    },
  });
  if (!user) throw new ApiError(404, 'User không tồn tại');
  return user;
};
