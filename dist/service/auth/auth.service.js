"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeService = exports.refreshTokenService = exports.logoutService = exports.loginWithEmailService = exports.resendVerificationEmail = exports.verifyEmailService = exports.sendVerificationEmailService = exports.registerWithMailService = exports.issueTokens = void 0;
const jwt_1 = require("../../utils/jwt");
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const mailer_1 = require("../../utils/mailer");
const hash_1 = require("../../utils/hash");
const email_queue_1 = require("../../queues/email.queue");
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const VERIFICATION_TOKEN_TTL_MS = 60 * 60 * 1000;
const revokeAllUserSessions = async (userId) => {
    await prisma_1.db.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
    });
    await prisma_1.db.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
    });
};
const throwRefreshTokenReuseError = async (userId) => {
    await revokeAllUserSessions(userId);
    throw new ApiError_1.ApiError(401, "Refresh token reuse detected; please sign in again", undefined, "TOKEN_REUSE_DETECTED");
};
const enqueueVerificationEmail = async (user) => {
    const rawToken = crypto_1.default.randomUUID();
    const verification = await prisma_1.db.emailVerification.create({
        data: {
            userId: user.id,
            token: (0, jwt_1.hashToken)(rawToken),
            expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
    });
    try {
        await email_queue_1.emailQueue.add("sendVerificationEmail", {
            userId: user.id,
            email: user.email,
            name: user.name,
            token: rawToken,
        }, {
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
        });
        await prisma_1.db.emailVerification.updateMany({
            where: {
                userId: user.id,
                isUsed: false,
            },
            data: {
                isUsed: true,
            },
        });
    }
    catch (error) {
        await prisma_1.db.emailVerification.delete({
            where: { id: verification.id },
        });
        throw error;
    }
};
const issueTokens = async (userId, role, meta) => {
    const user = await prisma_1.db.user.findUnique({
        where: { id: userId },
        select: { tokenVersion: true },
    });
    if (!user)
        throw new ApiError_1.ApiError(401, "User not found");
    const accessToken = (0, jwt_1.signAccessToken)({
        userId,
        role,
        tokenVersion: user.tokenVersion,
    });
    const rawRefreshToken = (0, jwt_1.generateOpaqueToken)();
    await prisma_1.db.refreshToken.create({
        data: {
            userId: userId,
            tokenHash: (0, jwt_1.hashToken)(rawRefreshToken),
            deviceInfo: meta.deviceInfo,
            ipAddress: meta.ipAddress,
            expiresAt: (0, jwt_1.getExpiresAt)(REFRESH_EXPIRES),
        },
    });
    return { accessToken, refreshToken: rawRefreshToken };
};
exports.issueTokens = issueTokens;
const registerWithMailService = async (data) => {
    const existing = await prisma_1.db.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        if (!existing.isVerified) {
            throw new ApiError_1.ApiError(409, "Email already registered but not verified");
        }
        throw new ApiError_1.ApiError(400, "User Already Exists");
    }
    const user = await prisma_1.db.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash: await (0, hash_1.hashPassword)(data.password),
            role: "CUSTOMER",
            isVerified: false,
        },
    });
    await enqueueVerificationEmail(user);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
};
exports.registerWithMailService = registerWithMailService;
const sendVerificationEmailService = async ({ email, name, token, }) => {
    const verifyURL = `${FRONTEND_URL}/email/verify?token=${token}`;
    await mailer_1.transporter.sendMail({
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
exports.sendVerificationEmailService = sendVerificationEmailService;
const verifyEmailService = async (rawToken, meta) => {
    const record = await prisma_1.db.emailVerification.findUnique({
        where: { token: (0, jwt_1.hashToken)(rawToken) },
        include: { user: true },
    });
    if (!record)
        throw new ApiError_1.ApiError(400, "Invalid verification link");
    if (record.expiresAt < new Date())
        throw new ApiError_1.ApiError(400, "Verification link has expired");
    const user = await prisma_1.db.user.update({
        where: { id: record.userId },
        data: { isVerified: true },
    });
    const tokens = await (0, exports.issueTokens)(user.id, user.role, meta);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
};
exports.verifyEmailService = verifyEmailService;
const resendVerificationEmail = async (email) => {
    const user = await prisma_1.db.user.findUnique({ where: { email } });
    if (!user)
        throw new ApiError_1.ApiError(404, "Email address not found");
    if (user.isVerified)
        throw new ApiError_1.ApiError(400, "Account is already verified");
    await enqueueVerificationEmail(user);
};
exports.resendVerificationEmail = resendVerificationEmail;
const loginWithEmailService = async (email, password, meta) => {
    const user = await prisma_1.db.user.findUnique({
        where: {
            email: email,
        },
    });
    if (!user || !user.passwordHash)
        throw new ApiError_1.ApiError(401, "Invalid email or password");
    if (!user.isVerified)
        throw new ApiError_1.ApiError(403, "Account is not verified");
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid)
        throw new ApiError_1.ApiError(401, "Invalid email or password");
    const token = await (0, exports.issueTokens)(user.id, user.role, meta);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens: token };
};
exports.loginWithEmailService = loginWithEmailService;
const logoutService = async (rawToken) => {
    await prisma_1.db.refreshToken.updateMany({
        where: {
            tokenHash: (0, jwt_1.hashToken)(rawToken),
        },
        data: {
            isRevoked: true,
        },
    });
};
exports.logoutService = logoutService;
const refreshTokenService = async (rawToken, meta) => {
    const stored = await prisma_1.db.refreshToken.findUnique({
        where: { tokenHash: (0, jwt_1.hashToken)(rawToken) },
    });
    if (!stored)
        throw new ApiError_1.ApiError(401, "Invalid refresh token");
    if (stored.isRevoked) {
        return throwRefreshTokenReuseError(stored.userId);
    }
    if (stored.expiresAt < new Date()) {
        await prisma_1.db.refreshToken.updateMany({
            where: {
                tokenHash: (0, jwt_1.hashToken)(rawToken),
            },
            data: {
                isRevoked: true,
            },
        });
        throw new ApiError_1.ApiError(401, "Token has expired");
    }
    const consumed = await prisma_1.db.refreshToken.updateMany({
        where: {
            tokenHash: stored.tokenHash,
            isRevoked: false,
        },
        data: {
            isRevoked: true,
            lastUsedAt: new Date(),
        },
    });
    if (consumed.count !== 1) {
        return throwRefreshTokenReuseError(stored.userId);
    }
    const user = await prisma_1.db.user.findUnique({ where: { id: stored.userId } });
    if (!user)
        throw new ApiError_1.ApiError(401, "User not found");
    const newToken = await (0, exports.issueTokens)(stored.userId, user.role, meta);
    return newToken;
};
exports.refreshTokenService = refreshTokenService;
const getMeService = async (userId) => {
    const user = await prisma_1.db.user.findUnique({
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
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    return user;
};
exports.getMeService = getMeService;
