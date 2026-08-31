import {
  registerWithMailService,
  loginWithEmailService,
  logoutService,
  resendVerificationEmail,
  verifyEmailService,
  refreshTokenService,
  getMeService,
} from "@/service/auth/auth.service";
import { Request, Response, NextFunction } from "express";
import type { RegisterInput } from "@/validation/auth.validate";
import { ApiError } from "@/utils/ApiError";
import { sendSuccess } from "@/utils/apiResponse";
export const registerWithEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = req.body as RegisterInput;
    const user = await registerWithMailService(input);
    return sendSuccess(res, user, { statusCode: 201, message: "User register success" });
  } catch (err) {
    next(err);
  }
};
export const reSendEmailVerifyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = req.body;
    await resendVerificationEmail(input.email);
    return sendSuccess(res, null, { message: "Email Verification Send Success" });
  } catch (err) {
    next(err);
  }
};
export const verifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tokenParam = req.query.token;
    if (typeof tokenParam !== "string" || !tokenParam) {
      throw new ApiError(400, "Missing or invalid token");
    }

    const userAgent = req.headers["user-agent"];
    const meta = {
      deviceInfo: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      ipAddress: req.ip,
    };

    const { user, tokens } = await verifyEmailService(tokenParam, meta);
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendSuccess(res, { accessToken: tokens.accessToken, user });
  } catch (err) {
    next(err);
  }
};
export const loginWithEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = req.body;
    const { user, tokens } = await loginWithEmailService(
      input.email,
      input.password,
      {
        deviceInfo: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    );
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendSuccess(res, { accessToken: tokens.accessToken, user });
  } catch (err: any) {
    next(err);
  }
};
export const refresthTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const tokens = await refreshTokenService(refreshToken, {
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { accessToken: tokens.accessToken });
  } catch (err) {
    res.clearCookie("refreshToken");
    next(err);
  }
};
export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(400, "Refresh token is missing");
    await logoutService(refreshToken);
    res.clearCookie("refreshToken");
    sendSuccess(res, null, { message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};
export const getMeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.set("Cache-Control", "no-store");
    const user = await getMeService(req.user?.userId!);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};
