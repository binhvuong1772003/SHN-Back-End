import { Request, Response, NextFunction } from 'express';
import {
  generateGoogleUrlService,
  generateOAuthStateService,
  handleGoogleCallbackService,
  revokeGoogleToken,
} from '@/service/auth/googleOauth.service';
import { logoutService } from '@/service/auth/auth.service';
export const googleLoginController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const state = generateOAuthStateService();
  req.session.oauthState = state;
  const authUrl = generateGoogleUrlService(state);
  console.log('authUrl:', authUrl);
  res.redirect(authUrl);
};
export const googleCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).json({
        message: 'Google login failed',
        error,
      });
    }
    if (typeof state !== 'string') {
      return res.status(400).json({ message: 'Invalid State', error });
    }
    if (!req.session.oauthState || req.session.oauthState !== state) {
      return res.status(400).json({ message: 'Invalid State', error });
    }

    if (typeof code !== 'string') {
      return res
        .status(400)
        .json({ message: 'Missing authorization code', error });
    }

    delete req.session.oauthState;
    const meta = {
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const { user, tokens } = await handleGoogleCallbackService(code, meta);
    res.cookie('temp_access', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 1000, // 1 phút thôi
    });
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('cookies:', req.cookies);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${tokens.accessToken}`
    );
  } catch (err) {
    next(err);
  }
};
export const googleLogoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { refreshToken } = req.body;

    // Revoke Google access token
    await revokeGoogleToken(userId);

    // Revoke app refresh token (tái sử dụng logoutService)
    if (refreshToken) {
      await logoutService(refreshToken);
    }

    res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    next(err);
  }
};
