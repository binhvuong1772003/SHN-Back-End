"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.redisConnection = new ioredis_1.default({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
    // BullMQ yêu cầu khi dùng ioredis connection cho Worker
    maxRetriesPerRequest: null,
});
exports.redisConnection.on("connect", () => {
    console.log("Redis connected");
});
exports.redisConnection.on("error", (error) => {
    console.error("Redis connection error:", error);
});
