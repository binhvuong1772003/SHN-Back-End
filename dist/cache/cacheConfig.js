"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisKeyPattern = exports.redisKey = exports.REDIS_QR_TTL_SECONDS = exports.REDIS_DEFAULT_TTL_SECONDS = exports.REDIS_KEY_VERSION = exports.REDIS_NAMESPACE = void 0;
const positiveInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
/** Shared Redis key contract. Bump REDIS_KEY_VERSION when the key shape changes. */
exports.REDIS_NAMESPACE = process.env.REDIS_NAMESPACE ?? "shn";
exports.REDIS_KEY_VERSION = process.env.REDIS_KEY_VERSION ?? "v1";
exports.REDIS_DEFAULT_TTL_SECONDS = positiveInteger(process.env.REDIS_CACHE_TTL_SECONDS, 60 * 60);
exports.REDIS_QR_TTL_SECONDS = positiveInteger(process.env.ATTENDANCE_QR_TTL_SECONDS, 180);
const redisKey = (...parts) => [exports.REDIS_NAMESPACE, exports.REDIS_KEY_VERSION, ...parts].join(":");
exports.redisKey = redisKey;
const redisKeyPattern = (...parts) => `${(0, exports.redisKey)(...parts)}:*`;
exports.redisKeyPattern = redisKeyPattern;
