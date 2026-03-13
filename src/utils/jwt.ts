import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

/**
 * ==============================
 * TOKEN PAYLOAD TYPES
 * ==============================
 */

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
}

/**
 * ==============================
 * SIGN TOKENS
 * ==============================
 */

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiresIn,
  } as SignOptions);
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiresIn,
  } as SignOptions);
};

/**
 * ==============================
 * VERIFY TOKENS
 * ==============================
 */

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, jwtConfig.accessTokenSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, jwtConfig.refreshTokenSecret) as RefreshTokenPayload;
};
// ─── Generate opaque refresh token (random) ────────────────
// Dùng cách này thay vì JWT để dễ revoke
export const generateOpaqueToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// ─── Hash token để lưu DB (không lưu plaintext) ────────────
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
// ─── Tính expiresAt từ string (e.g. "30d") ─────────────────
export const getExpiresAt = (duration: string): Date => {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const [, num, unit] = match;
  return new Date(Date.now() + parseInt(num) * units[unit]);
};
