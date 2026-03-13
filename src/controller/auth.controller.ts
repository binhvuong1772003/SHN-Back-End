import {
  registerWithMailService,
  loginWithEmailService,
  logoutService,
  resendVerificationEmail,
  verifyEmailService,
  refreshTokenService,
  getMeService,
} from '@/service/auth/auth.service';
import { Request, Response, NextFunction } from 'express';
import type { RegisterInput } from '@/validation/auth.validate';
import { ApiError } from '@/utils/ApiError';
export const registerWithEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body as RegisterInput;
    const user = await registerWithMailService(input);
    return res.status(201).json({
      success: true,
      message: 'User register success',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
export const reSendEmailVerifyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body;
    await resendVerificationEmail(input.email);
    return res.status(200).json('Email Verification Send Success');
  } catch (err) {
    next(err);
  }
};
export const verifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenParam = req.query.token;
    if (typeof tokenParam !== 'string' || !tokenParam) {
      throw new ApiError(400, 'Missing or invalid token');
    }

    const userAgent = req.headers['user-agent'];
    const meta = {
      deviceInfo: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      ipAddress: req.ip,
    };

    const result = await verifyEmailService(tokenParam, meta);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
export const loginWithEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body;
    const { user, tokens } = await loginWithEmailService(
      input.email,
      input.password,
      {
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
      }
    );
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res
      .status(200)
      .json({ success: true, acessToken: tokens.accessToken, user });
  } catch (err: any) {
    next(err);
  }
};
export const refresthTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token không hợp lệ');
    }

    const tokens = await refreshTokenService(refreshToken, {
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json({ success: true, acessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
};
export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(400, 'Không có refresh token');
    await logoutService(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    next(err);
  }
};
export const getMeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.set('Cache-Control', 'no-store');
    const user = await getMeService(req.user?.userId!);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
