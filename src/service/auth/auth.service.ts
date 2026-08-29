import {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  getExpiresAt,
} from "@/utils/jwt";
import { UserRole } from "@prisma/client";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { transporter } from "@/utils/mailer";
import { hashPassword } from "@/utils/hash";
import { emailQueue } from "@/queues/email.queue";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const VERIFICATION_TOKEN_TTL_MS = 60 * 60 * 1000;
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const enqueueVerificationEmail = async (user: {
  id: string;
  email: string;
  name: string;
}) => {
  const rawToken = crypto.randomUUID();
  const verification = await db.emailVerification.create({
    data: {
      userId: user.id,
      token: hashToken(rawToken),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  try {
    await emailQueue.add(
      "sendVerificationEmail",
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        token: rawToken,
      },
      {
        jobId: `verification-${verification.id}`,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 1000,
        },
      },
    );
    await db.emailVerification.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });
  } catch (error) {
    await db.emailVerification.delete({
      where: { id: verification.id },
    });
    throw error;
  }
};

export const issueTokens = async (
  userId: string,
  role: UserRole,
  meta: { deviceInfo?: string; ipAddress?: string },
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
      throw new ApiError(409, "Email already registered but not verified");
    }
    throw new ApiError(400, "User Already Exists");
  }
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: "CUSTOMER",
      isVerified: false,
    },
  });
  await enqueueVerificationEmail(user);
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};
export const sendVerificationEmailService = async ({
  email,
  name,
  token,
}: {
  email: string;
  name?: string;
  token: string;
}) => {
  const verifyURL = `${FRONTEND_URL}/email/verify?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Email from TLOB",
    html: `
      <h2>Hello ${name ?? ""} Email Verification</h2>
      <p>Click link below to verify:</p>
      <a href="${verifyURL}">${verifyURL}</a>
    `,
  });
};
export const verifyEmailService = async (
  rawToken: string,
  meta: { deviceInfo?: string; ipAddress?: string },
): Promise<{ user: object; tokens: AuthTokens }> => {
  const record = await db.emailVerification.findUnique({
    where: { token: hashToken(rawToken) },
    include: { user: true },
  });
  if (!record) throw new ApiError(400, "Link xác thực không hợp lệ");
  if (record.expiresAt < new Date())
    throw new ApiError(400, "Link xác thực đã hết hạn");
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
  if (!user) throw new ApiError(404, "Email không tồn tại");
  if (user.isVerified) throw new ApiError(400, "Tài khoản đã được xác thực");
  await enqueueVerificationEmail(user);
};
export const loginWithEmailService = async (
  email: string,
  password: string,
  meta: { deviceInfo?: string; ipAddress?: string },
): Promise<{ user: object; tokens: AuthTokens }> => {
  const user = await db.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user || !user.passwordHash)
    throw new ApiError(401, "Email hoặc Password không chính xác");
  if (!user.isVerified) throw new ApiError(403, "Tài khoản chưa được xác thực");
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isPasswordValid)
    throw new ApiError(401, "Email hoặc Password không chính xác");
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
  meta: { deviceInfo?: string; ipAddress?: string },
): Promise<AuthTokens> => {
  const stored = await db.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!stored) throw new ApiError(401, "Refresh token không hợp lệ");
  if (stored.isRevoked) {
    await db.refreshToken.updateMany({
      where: { userId: stored.userId },
      data: { isRevoked: true },
    });
    throw new ApiError(401, "Phát hiện bất thường, vui lòng đăng nhập lại");
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
    throw new ApiError(401, "Token đã hết hạn");
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
  if (!user) throw new ApiError(401, "Người dùng không tồn tại");
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
  if (!user) throw new ApiError(404, "User không tồn tại");
  return user;
};
