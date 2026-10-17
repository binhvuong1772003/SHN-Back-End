import { redisConnection } from "@/config/redis";
import { REDIS_DEFAULT_TTL_SECONDS } from "@/cache/cacheConfig";
import {
  recordRedisCacheError,
  recordRedisCacheHit,
  recordRedisCacheMiss,
} from "@/observability/redisMetrics";

export interface CacheAsideOptions {
  ttlSeconds?: number;
}

/**
 * Read-through cache-aside helper. Redis failures never prevent the source
 * loader from returning data, so caching remains an optimization only.
 */
export const cacheAside = async <T>(
  key: string,
  loader: () => Promise<T>,
  options: CacheAsideOptions = {},
): Promise<T> => {
  const configuredTtl = options.ttlSeconds;
  const ttlSeconds = configuredTtl !== undefined && Number.isInteger(configuredTtl) && configuredTtl > 0
    ? configuredTtl
    : REDIS_DEFAULT_TTL_SECONDS;

  try {
    const cached = await redisConnection.get(key);
    if (cached !== null) {
      try {
        const value = JSON.parse(cached) as T;
        recordRedisCacheHit(key);
        console.log(`[Redis] cache hit: ${key}`);
        return value;
      } catch (error) {
        recordRedisCacheMiss(key);
        recordRedisCacheError(key);
        console.error(`[Redis] invalid cache payload, removing ${key}:`, error);
        await redisConnection.del(key);
      }
    } else {
      recordRedisCacheMiss(key);
    }
  } catch (error) {
    recordRedisCacheError(key);
    console.error(`[Redis] cache read failed for ${key}:`, error);
  }

  const value = await loader();

  try {
    await redisConnection.set(key, JSON.stringify(value), "EX", ttlSeconds);
    console.log(`[Redis] cache stored: ${key}`);
  } catch (error) {
    recordRedisCacheError(key);
    console.error(`[Redis] cache write failed for ${key}:`, error);
  }

  return value;
};
