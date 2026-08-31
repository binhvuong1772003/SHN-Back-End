"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeController = exports.logoutController = exports.refresthTokenController = exports.loginWithEmailController = exports.verifyEmailController = exports.reSendEmailVerifyController = exports.registerWithEmailController = void 0;
const auth_service_1 = require("@/service/auth/auth.service");
const ApiError_1 = require("@/utils/ApiError");
const apiResponse_1 = require("@/utils/apiResponse");
const registerWithEmailController = async (req, res, next) => {
    try {
        const input = req.body;
        const user = await (0, auth_service_1.registerWithMailService)(input);
        return (0, apiResponse_1.sendSuccess)(res, user, { statusCode: 201, message: "User register success" });
    }
    catch (err) {
        next(err);
    }
};
exports.registerWithEmailController = registerWithEmailController;
const reSendEmailVerifyController = async (req, res, next) => {
    try {
        const input = req.body;
        await (0, auth_service_1.resendVerificationEmail)(input.email);
        return (0, apiResponse_1.sendSuccess)(res, null, { message: "Email Verification Send Success" });
    }
    catch (err) {
        next(err);
    }
};
exports.reSendEmailVerifyController = reSendEmailVerifyController;
const verifyEmailController = async (req, res, next) => {
    try {
        const tokenParam = req.query.token;
        if (typeof tokenParam !== "string" || !tokenParam) {
            throw new ApiError_1.ApiError(400, "Missing or invalid token");
        }
        const userAgent = req.headers["user-agent"];
        const meta = {
            deviceInfo: Array.isArray(userAgent) ? userAgent[0] : userAgent,
            ipAddress: req.ip,
        };
        const { user, tokens } = await (0, auth_service_1.verifyEmailService)(tokenParam, meta);
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return (0, apiResponse_1.sendSuccess)(res, { accessToken: tokens.accessToken, user });
    }
    catch (err) {
        next(err);
    }
};
exports.verifyEmailController = verifyEmailController;
const loginWithEmailController = async (req, res, next) => {
    try {
        const input = req.body;
        const { user, tokens } = await (0, auth_service_1.loginWithEmailService)(input.email, input.password, {
            deviceInfo: req.headers["user-agent"],
            ipAddress: req.ip,
        });
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return (0, apiResponse_1.sendSuccess)(res, { accessToken: tokens.accessToken, user });
    }
    catch (err) {
        next(err);
    }
};
exports.loginWithEmailController = loginWithEmailController;
const refresthTokenController = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new ApiError_1.ApiError(401, "Invalid refresh token");
        }
        const tokens = await (0, auth_service_1.refreshTokenService)(refreshToken, {
            deviceInfo: req.headers["user-agent"],
            ipAddress: req.ip,
        });
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return (0, apiResponse_1.sendSuccess)(res, { accessToken: tokens.accessToken });
    }
    catch (err) {
        res.clearCookie("refreshToken");
        next(err);
    }
};
exports.refresthTokenController = refresthTokenController;
const logoutController = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            throw new ApiError_1.ApiError(400, "Refresh token is missing");
        await (0, auth_service_1.logoutService)(refreshToken);
        res.clearCookie("refreshToken");
        (0, apiResponse_1.sendSuccess)(res, null, { message: "Logout successful" });
    }
    catch (err) {
        next(err);
    }
};
exports.logoutController = logoutController;
const getMeController = async (req, res, next) => {
    try {
        res.set("Cache-Control", "no-store");
        const user = await (0, auth_service_1.getMeService)(req.user?.userId);
        (0, apiResponse_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
};
exports.getMeController = getMeController;
