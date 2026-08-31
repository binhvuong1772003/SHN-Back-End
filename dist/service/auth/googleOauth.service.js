"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeGoogleToken = exports.handleGoogleCallbackService = exports.upsertGoogleAccountService = exports.getGoogleUserInfo = exports.exchangeCodeForGoogleTokenService = exports.generateOAuthStateService = exports.generateGoogleUrlService = void 0;
const google_config_1 = __importDefault(require("../../config/google.config"));
const ApiError_1 = require("../../utils/ApiError");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../../db/prisma");
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
const generateGoogleUrlService = (state) => {
    const params = new URLSearchParams({
        client_id: google_config_1.default.clientId,
        redirect_uri: google_config_1.default.redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        prompt: 'consent',
        state: state,
    });
    return `${google_config_1.default.authUrl}?${params.toString()}`;
};
exports.generateGoogleUrlService = generateGoogleUrlService;
const generateOAuthStateService = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateOAuthStateService = generateOAuthStateService;
const exchangeCodeForGoogleTokenService = async (code) => {
    try {
        const { data } = await axios_1.default.post(google_config_1.default.tokenUrl, new URLSearchParams({
            code,
            client_id: google_config_1.default.clientId,
            client_secret: google_config_1.default.clientSecret,
            redirect_uri: google_config_1.default.redirectUri,
            grant_type: 'authorization_code',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return {
            access_token: data.access_token,
            expires_in: data.expires_in,
            refresh_token: data.refresh_token,
            id_token: data.id_token,
        };
    }
    catch (err) {
        throw new ApiError_1.ApiError(400, 'Failed to exchange code for Google token');
    }
};
exports.exchangeCodeForGoogleTokenService = exchangeCodeForGoogleTokenService;
const getGoogleUserInfo = async (accessToken) => {
    try {
        const { data } = await axios_1.default.get(google_config_1.default.userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture,
        };
    }
    catch (err) {
        throw new ApiError_1.ApiError(400, 'Failed to get Google user info');
    }
};
exports.getGoogleUserInfo = getGoogleUserInfo;
const upsertGoogleAccountService = async (googleUser, googleToken) => {
    const expireAt = new Date(Date.now() + googleToken.expires_in * 1000);
    const existingOauth = await prisma_1.db.oAuthAccount.findUnique({
        where: {
            provider_providerId: {
                provider: client_1.OAuthProvider.GOOGLE,
                providerId: googleUser.id,
            },
        },
        include: {
            user: true,
        },
    });
    if (existingOauth) {
        await prisma_1.db.oAuthAccount.update({
            where: {
                id: existingOauth.id,
            },
            data: {
                accessToken: googleToken.access_token,
                refreshToken: googleToken.refresh_token,
                expiresAt: expireAt,
            },
        });
        return existingOauth.user;
    }
    const user = await prisma_1.db.user.findUnique({
        where: {
            email: googleUser.email,
        },
    });
    if (user) {
        await prisma_1.db.oAuthAccount.create({
            data: {
                provider: client_1.OAuthProvider.GOOGLE,
                providerId: googleUser.id,
                userId: user.id,
                email: googleUser.email,
                name: googleUser.name,
                avatarUrl: googleUser.picture,
                accessToken: googleToken.access_token,
                refreshToken: googleToken.refresh_token,
                expiresAt: expireAt,
            },
        });
        return prisma_1.db.user.update({
            where: { id: user.id },
            data: {
                isActive: true,
            },
        });
    }
    return await prisma_1.db.user.create({
        data: {
            name: googleUser.name,
            email: googleUser.email,
            avatarUrl: googleUser.picture,
            isActive: true,
            isVerified: true,
            role: 'CUSTOMER',
            oauthAccounts: {
                create: {
                    provider: client_1.OAuthProvider.GOOGLE,
                    providerId: googleUser.id,
                    email: googleUser.email,
                    name: googleUser.name,
                    avatarUrl: googleUser.picture,
                    accessToken: googleToken.access_token,
                    refreshToken: googleToken.refresh_token,
                    expiresAt: expireAt,
                },
            },
        },
    });
};
exports.upsertGoogleAccountService = upsertGoogleAccountService;
const handleGoogleCallbackService = async (code, meta) => {
    const googleToken = await (0, exports.exchangeCodeForGoogleTokenService)(code);
    const googleUser = await (0, exports.getGoogleUserInfo)(googleToken.access_token);
    const user = await (0, exports.upsertGoogleAccountService)(googleUser, googleToken);
    if (!user) {
        throw new ApiError_1.ApiError(400, 'Failed to create user');
    }
    const tokens = await (0, auth_service_1.issueTokens)(user.id, user.role, meta);
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, tokens };
};
exports.handleGoogleCallbackService = handleGoogleCallbackService;
const revokeGoogleToken = async (userId) => {
    const oauthAccount = await prisma_1.db.oAuthAccount.findFirst({
        where: { userId, provider: client_1.OAuthProvider.GOOGLE },
    });
    if (!oauthAccount)
        throw new ApiError_1.ApiError(404, 'Google account not found');
    try {
        if (oauthAccount.accessToken) {
            await axios_1.default.post(google_config_1.default.revokeUrl, new URLSearchParams({ token: oauthAccount.accessToken }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        }
    }
    catch (err) {
        console.log(err);
    }
    await prisma_1.db.oAuthAccount.update({
        where: {
            id: oauthAccount.id,
        },
        data: {
            refreshToken: null,
            accessToken: null,
            expiresAt: null,
        },
    });
};
exports.revokeGoogleToken = revokeGoogleToken;
