"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.resendVerificationSchema = exports.emailVerificationQuerySchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.registerSchema = {
    body: zod_1.default.object({
        name: zod_1.default.string().min(1),
        email: zod_1.default.string().email(),
        password: zod_1.default.string().min(6),
    }),
};
exports.loginSchema = {
    body: zod_1.default.object({
        email: zod_1.default.string().email(),
        password: zod_1.default.string().min(6),
    }),
};
exports.emailVerificationQuerySchema = {
    query: zod_1.default.object({ token: zod_1.default.string().min(1, "Verification token is required") }),
};
exports.resendVerificationSchema = {
    body: zod_1.default.object({ email: zod_1.default.string().email("Invalid email address") }),
};
exports.refreshTokenSchema = {
    body: zod_1.default.object({
        refreshToken: zod_1.default.string(),
    }),
};
