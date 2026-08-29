"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("@/config/redis");
const auth_service_1 = require("@/service/auth/auth.service");
const EMAIL_QUEUE_NAME = "email";
const SEND_VERIFICATION_EMAIL_JOB = "sendVerificationEmail";
const processEmailJob = async (job) => {
    switch (job.name) {
        case SEND_VERIFICATION_EMAIL_JOB: {
            const { userId, email, name, token } = job.data;
            await (0, auth_service_1.sendVerificationEmailService)({
                email,
                name,
                token,
            });
            return { userId };
        }
        default:
            throw new Error(`Unknown email job: ${job.name}`);
    }
};
exports.emailWorker = new bullmq_1.Worker(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redis_1.redisConnection,
    concurrency: 5,
});
exports.emailWorker.on("failed", (job, error) => {
    console.error("Email job failed", {
        jobId: job?.id,
        jobName: job?.name,
        error: error.message,
    });
});
