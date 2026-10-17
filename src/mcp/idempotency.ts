import { redisConnection } from "@/config/redis";
import { ApiError } from "@/utils/ApiError";

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

type IdempotencyInput = {
  shopId: string;
  userId: string;
  operation: string;
  idempotencyKey: string;
};

type IdempotencyRecord<T> =
  | { status: "IN_PROGRESS" }
  | { status: "COMPLETED"; response: T }
  | { status: "FAILED"; errorMessage: string };

const getKey = ({
  shopId,
  userId,
  operation,
  idempotencyKey,
}: IdempotencyInput) =>
  ["mcp", "idempotency", shopId, userId, operation, idempotencyKey]
    .map((part) => encodeURIComponent(part))
    .join(":");

export const runWithMcpIdempotency = async <T>(
  input: IdempotencyInput,
  execute: () => Promise<T>,
): Promise<T> => {
  const key = getKey(input);
  const inProgress: IdempotencyRecord<T> = { status: "IN_PROGRESS" };
  const reserved = await redisConnection.set(
    key,
    JSON.stringify(inProgress),
    "EX",
    IDEMPOTENCY_TTL_SECONDS,
    "NX",
  );

  if (reserved !== "OK") {
    const existingValue = await redisConnection.get(key);
    if (existingValue) {
      const existing = JSON.parse(existingValue) as IdempotencyRecord<T>;
      if (existing.status === "COMPLETED") return existing.response;
      if (existing.status === "IN_PROGRESS") {
        throw new ApiError(409, "This operation is already in progress");
      }
    }

    await redisConnection.set(
      key,
      JSON.stringify(inProgress),
      "EX",
      IDEMPOTENCY_TTL_SECONDS,
    );
  }

  try {
    const result = await execute();
    const completed: IdempotencyRecord<T> = {
      status: "COMPLETED",
      response: result,
    };
    await redisConnection.set(
      key,
      JSON.stringify(completed),
      "EX",
      IDEMPOTENCY_TTL_SECONDS,
    );
    return result;
  } catch (error) {
    const failed: IdempotencyRecord<T> = {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Operation failed",
    };
    await redisConnection.set(
      key,
      JSON.stringify(failed),
      "EX",
      IDEMPOTENCY_TTL_SECONDS,
    );
    throw error;
  }
};
