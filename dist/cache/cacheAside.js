"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheAside = void 0;
const redis_1 = require("../config/redis");
const cacheConfig_1 = require("../cache/cacheConfig");
const redisMetrics_1 = require("../observability/redisMetrics");
/**
 * Read-through cache-aside helper. Redis failures never prevent the source
 * loader from returning data, so caching remains an optimization only.
 */
const cacheAside = async (key, loader, options = {}) => {
    const configuredTtl = options.ttlSeconds;
    const ttlSeconds = configuredTtl !== undefined && Number.isInteger(configuredTtl) && configuredTtl > 0
        ? configuredTtl
        : cacheConfig_1.REDIS_DEFAULT_TTL_SECONDS;
    try {
        const cached = await redis_1.redisConnection.get(key);
        if (cached !== null) {
            try {
                const value = JSON.parse(cached);
                (0, redisMetrics_1.recordRedisCacheHit)(key);
                console.log(`[Redis] cache hit: ${key}`);
                return value;
            }
            catch (error) {
                (0, redisMetrics_1.recordRedisCacheMiss)(key);
                (0, redisMetrics_1.recordRedisCacheError)(key);
                console.error(`[Redis] invalid cache payload, removing ${key}:`, error);
                await redis_1.redisConnection.del(key);
            }
        }
        else {
            (0, redisMetrics_1.recordRedisCacheMiss)(key);
        }
    }
    catch (error) {
        (0, redisMetrics_1.recordRedisCacheError)(key);
        console.error(`[Redis] cache read failed for ${key}:`, error);
    }
    const value = await loader();
    try {
        await redis_1.redisConnection.set(key, JSON.stringify(value), "EX", ttlSeconds);
        console.log(`[Redis] cache stored: ${key}`);
    }
    catch (error) {
        (0, redisMetrics_1.recordRedisCacheError)(key);
        console.error(`[Redis] cache write failed for ${key}:`, error);
    }
    return value;
};
exports.cacheAside = cacheAside;
