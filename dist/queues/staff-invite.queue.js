"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffInviteQueue = exports.SEND_STAFF_INVITE_EMAIL_JOB = exports.STAFF_INVITE_QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("@/config/redis");
exports.STAFF_INVITE_QUEUE_NAME = "staff-invite";
exports.SEND_STAFF_INVITE_EMAIL_JOB = "sendStaffInviteEmail";
exports.staffInviteQueue = new bullmq_1.Queue(exports.STAFF_INVITE_QUEUE_NAME, {
    connection: redis_1.redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: {
            age: 24 * 60 * 60,
            count: 1000,
        },
    },
});
