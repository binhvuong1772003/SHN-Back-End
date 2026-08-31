// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { ApiError } from '@/utils/ApiError';
import { db } from '@/db/prisma';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true, isActive: true },
    });
    if (!user || !user.isActive || payload.tokenVersion !== user.tokenVersion) {
      return next(new ApiError(401, 'Session has been revoked'));
    }
    req.user = payload;
    next();
  } catch {
    return next(new ApiError(401, 'Token is invalid or has expired'));
  }
};
