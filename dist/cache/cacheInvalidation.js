"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearServiceListCache = exports.clearStaffListCache = exports.clearStaffScheduleCache = void 0;
const redis_1 = require("@/config/redis");
const cacheKeys_1 = require("@/cache/cacheKeys");
const clearStaffScheduleCache = async (shopId, staffId) => {
    await redis_1.redisConnection.del((0, cacheKeys_1.staffScheduleCacheKey)(shopId, staffId));
};
exports.clearStaffScheduleCache = clearStaffScheduleCache;
const clearStaffListCache = async (shopSlug) => {
    const keys = [];
    let cursor = "0";
    do {
        const [nextCursor, foundKeys] = await redis_1.redisConnection.scan(cursor, "MATCH", (0, cacheKeys_1.staffListCachePattern)(shopSlug), "COUNT", 100);
        cursor = nextCursor;
        keys.push(...foundKeys);
    } while (cursor !== "0");
    if (keys.length > 0) {
        await redis_1.redisConnection.del(...keys);
    }
};
exports.clearStaffListCache = clearStaffListCache;
const clearServiceListCache = async (shopSlug) => {
    const keys = [];
    let cursor = "0";
    do {
        const [nextCursor, foundKeys] = await redis_1.redisConnection.scan(cursor, "MATCH", (0, cacheKeys_1.serviceListCachePattern)(shopSlug), "COUNT", 100);
        cursor = nextCursor;
        keys.push(...foundKeys);
    } while (cursor !== "0");
    if (keys.length > 0)
        await redis_1.redisConnection.del(...keys);
};
exports.clearServiceListCache = clearServiceListCache;
