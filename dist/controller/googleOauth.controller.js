"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogoutController = exports.googleCallbackController = exports.googleLoginController = void 0;
const googleOauth_service_1 = require("@/service/auth/googleOauth.service");
const auth_service_1 = require("@/service/auth/auth.service");
const apiResponse_1 = require("@/utils/apiResponse");
const googleLoginController = (req, res, next) => {
    const state = (0, googleOauth_service_1.generateOAuthStateService)();
    req.session.oauthState = state;
    const authUrl = (0, googleOauth_service_1.generateGoogleUrlService)(state);
    console.log('authUrl:', authUrl);
    res.redirect(authUrl);
};
exports.googleLoginController = googleLoginController;
const googleCallbackController = async (req, res, next) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            return (0, apiResponse_1.sendError)(res, 400, 'Google login failed', { code: 'GOOGLE_LOGIN_FAILED', details: error });
        }
        if (typeof state !== 'string') {
            return (0, apiResponse_1.sendError)(res, 400, 'Invalid State', { code: 'INVALID_OAUTH_STATE' });
        }
        if (!req.session.oauthState || req.session.oauthState !== state) {
            return (0, apiResponse_1.sendError)(res, 400, 'Invalid State', { code: 'INVALID_OAUTH_STATE' });
        }
        if (typeof code !== 'string') {
            return (0, apiResponse_1.sendError)(res, 400, 'Missing authorization code', { code: 'MISSING_AUTHORIZATION_CODE' });
        }
        delete req.session.oauthState;
        const meta = {
            deviceInfo: req.headers['user-agent'],
            ipAddress: req.ip,
        };
        const { user, tokens } = await (0, googleOauth_service_1.handleGoogleCallbackService)(code, meta);
        res.cookie('temp_access', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 60 * 1000, // Expires after one minute.
        });
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
        console.log('cookies:', req.cookies);
        res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${tokens.accessToken}`);
    }
    catch (err) {
        next(err);
    }
};
exports.googleCallbackController = googleCallbackController;
const googleLogoutController = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, apiResponse_1.sendError)(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED' });
        }
        const { refreshToken } = req.body;
        // Revoke Google access token
        await (0, googleOauth_service_1.revokeGoogleToken)(userId);
        // Revoke the app refresh token through logoutService.
        if (refreshToken) {
            await (0, auth_service_1.logoutService)(refreshToken);
        }
        (0, apiResponse_1.sendSuccess)(res, null, { message: 'Logout successful' });
    }
    catch (err) {
        next(err);
    }
};
exports.googleLogoutController = googleLogoutController;
