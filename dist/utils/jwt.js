"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpiresAt = exports.hashToken = exports.generateOpaqueToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("@/config/jwt");
const crypto_1 = __importDefault(require("crypto"));
/**
 * ==============================
 * SIGN TOKENS
 * ==============================
 */
const signAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfig.accessTokenSecret, {
        expiresIn: jwt_1.jwtConfig.accessTokenExpiresIn,
    });
};
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfig.refreshTokenSecret, {
        expiresIn: jwt_1.jwtConfig.refreshTokenExpiresIn,
    });
};
exports.signRefreshToken = signRefreshToken;
/**
 * ==============================
 * VERIFY TOKENS
 * ==============================
 */
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.accessTokenSecret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.refreshTokenSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
// ─── Generate opaque refresh token (random) ────────────────
// Dùng cách này thay vì JWT để dễ revoke
const generateOpaqueToken = () => {
    return crypto_1.default.randomBytes(64).toString("hex");
};
exports.generateOpaqueToken = generateOpaqueToken;
// ─── Hash token để lưu DB (không lưu plaintext) ────────────
const hashToken = (token) => {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
};
exports.hashToken = hashToken;
// ─── Tính expiresAt từ string (e.g. "30d") ─────────────────
const getExpiresAt = (duration) => {
    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match)
        throw new Error(`Invalid duration: ${duration}`);
    const [, num, unit] = match;
    return new Date(Date.now() + parseInt(num) * units[unit]);
};
exports.getExpiresAt = getExpiresAt;
