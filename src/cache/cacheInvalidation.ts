import { redisConnection } from "@/config/redis";

export const clearStaffListCache = async (shopSlug: string) => {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, foundKeys] = await redisConnection.scan(
      cursor,
      "MATCH",
      `shop:${shopSlug}:staff:list:*`,
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
      `shop:${shopSlug}:service:list:*`,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== "0");
  if (keys.length > 0) await redisConnection.del(...keys);
};
