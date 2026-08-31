const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** Shared Redis key contract. Bump REDIS_KEY_VERSION when the key shape changes. */
export const REDIS_NAMESPACE = process.env.REDIS_NAMESPACE ?? "shn";
export const REDIS_KEY_VERSION = process.env.REDIS_KEY_VERSION ?? "v1";
export const REDIS_DEFAULT_TTL_SECONDS = positiveInteger(
  process.env.REDIS_CACHE_TTL_SECONDS,
  60 * 60,
);
export const REDIS_QR_TTL_SECONDS = positiveInteger(
  process.env.ATTENDANCE_QR_TTL_SECONDS,
  180,
);

export const redisKey = (...parts: string[]) =>
  [REDIS_NAMESPACE, REDIS_KEY_VERSION, ...parts].join(":");

export const redisKeyPattern = (...parts: string[]) => `${redisKey(...parts)}:*`;
