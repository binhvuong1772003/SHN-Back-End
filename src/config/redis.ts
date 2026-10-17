import Redis from "ioredis";

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),

  // BullMQ requires this setting when sharing an ioredis connection with a worker.
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("Redis connected");
});

redisConnection.on("error", (error) => {
  console.error("Redis connection error:", error);
});
