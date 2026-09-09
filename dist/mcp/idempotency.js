"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithMcpIdempotency = void 0;
const redis_1 = require("../config/redis");
const ApiError_1 = require("../utils/ApiError");
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const getKey = ({ shopId, userId, operation, idempotencyKey, }) => ["mcp", "idempotency", shopId, userId, operation, idempotencyKey]
    .map((part) => encodeURIComponent(part))
    .join(":");
const runWithMcpIdempotency = async (input, execute) => {
    const key = getKey(input);
    const inProgress = { status: "IN_PROGRESS" };
    const reserved = await redis_1.redisConnection.set(key, JSON.stringify(inProgress), "EX", IDEMPOTENCY_TTL_SECONDS, "NX");
    if (reserved !== "OK") {
        const existingValue = await redis_1.redisConnection.get(key);
        if (existingValue) {
            const existing = JSON.parse(existingValue);
            if (existing.status === "COMPLETED")
                return existing.response;
            if (existing.status === "IN_PROGRESS") {
                throw new ApiError_1.ApiError(409, "This operation is already in progress");
            }
        }
        await redis_1.redisConnection.set(key, JSON.stringify(inProgress), "EX", IDEMPOTENCY_TTL_SECONDS);
    }
    try {
        const result = await execute();
        const completed = {
            status: "COMPLETED",
            response: result,
        };
        await redis_1.redisConnection.set(key, JSON.stringify(completed), "EX", IDEMPOTENCY_TTL_SECONDS);
        return result;
    }
    catch (error) {
        const failed = {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Operation failed",
        };
        await redis_1.redisConnection.set(key, JSON.stringify(failed), "EX", IDEMPOTENCY_TTL_SECONDS);
        throw error;
    }
};
exports.runWithMcpIdempotency = runWithMcpIdempotency;
