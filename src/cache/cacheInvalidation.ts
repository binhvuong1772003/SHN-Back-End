import { redisConnection } from "@/config/redis";
import {
  serviceListCachePattern,
  staffListCachePattern,
  staffScheduleCacheKey,
} from "@/cache/cacheKeys";

export const clearStaffScheduleCache = async (
  shopId: string,
  staffId: string,
) => {
  await redisConnection.del(staffScheduleCacheKey(shopId, staffId));
};

export const clearStaffListCache = async (shopSlug: string) => {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, foundKeys] = await redisConnection.scan(
      cursor,
      "MATCH",
      staffListCachePattern(shopSlug),
      "COUNT",
      100,
    );
    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== "0");

  if (keys.length > 0) {
    await redisConnection.del(...keys);
  }
};

export const clearServiceListCache = async (shopSlug: string) => {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [nextCursor, foundKeys] = await redisConnection.scan(
      cursor,
      "MATCH",
      serviceListCachePattern(shopSlug),
      "COUNT",
      100,
    );
    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== "0");
  if (keys.length > 0) await redisConnection.del(...keys);
};
