import { Request, Response, NextFunction } from "express";
import {
  generateGoogleUrlService,
  generateOAuthStateService,
  handleGoogleCallbackService,
  revokeGoogleToken,
} from "@/service/auth/googleOauth.service";
import { logoutService } from "@/service/auth/auth.service";
import { sendError, sendSuccess } from "@/utils/apiResponse";
export const googleLoginController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const state = generateOAuthStateService();
  req.session.oauthState = state;
  const authUrl = generateGoogleUrlService(state);
  console.log("authUrl:", authUrl);
  res.redirect(authUrl);
};
export const googleCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return sendError(res, 400, "Google login failed", {
        code: "GOOGLE_LOGIN_FAILED",
        details: error,
      });
    }
    if (typeof state !== "string") {
      return sendError(res, 400, "Invalid State", {
        code: "INVALID_OAUTH_STATE",
      });
    }
    if (!req.session.oauthState || req.session.oauthState !== state) {
      return sendError(res, 400, "Invalid State", {
        code: "INVALID_OAUTH_STATE",
      });
    }

    if (typeof code !== "string") {
      return sendError(res, 400, "Missing authorization code", {
        code: "MISSING_AUTHORIZATION_CODE",
      });
    }

    delete req.session.oauthState;
    const meta = {
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    };
    const { user, tokens } = await handleGoogleCallbackService(code, meta);
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
      // Expires after one minute.
    });
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("cookies:", req.cookies);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${tokens.accessToken}`,
    );
  } catch (err) {
    next(err);
  }
};
export const googleLogoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, "Unauthorized", { code: "UNAUTHORIZED" });
    }
    const { refreshToken } = req.body;

    // Revoke Google access token
    await revokeGoogleToken(userId);

    // Revoke the app refresh token through logoutService.
    if (refreshToken) {
      await logoutService(refreshToken);
    }

    sendSuccess(res, null, { message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};
