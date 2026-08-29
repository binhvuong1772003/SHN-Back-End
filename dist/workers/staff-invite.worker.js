"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffInviteWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("@/config/redis");
const mailer_1 = require("@/utils/mailer");
const staff_invite_queue_1 = require("@/queues/staff-invite.queue");
const processStaffInviteJob = async (job) => {
    if (job.name !== staff_invite_queue_1.SEND_STAFF_INVITE_EMAIL_JOB) {
        throw new Error(`Unknown staff invite job: ${job.name}`);
    }
    const { email, shopName, role, inviteUrl, expiresAt } = job.data;
    await mailer_1.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Bạn được mời tham gia ${shopName}`,
        html: `
      <h2>Lời mời tham gia ${shopName}</h2>
      <p>Vai trò: <strong>${role}</strong></p>
      <a href="${inviteUrl}">Chấp nhận lời mời</a>
      <p>Link hết hạn vào ${new Date(expiresAt).toLocaleString("vi-VN")}.</p>
    `,
    });
    return { inviteId: job.data.inviteId };
};
exports.staffInviteWorker = new bullmq_1.Worker(staff_invite_queue_1.STAFF_INVITE_QUEUE_NAME, processStaffInviteJob, {
    connection: redis_1.redisConnection,
    concurrency: 5,
});
exports.staffInviteWorker.on("completed", (job) => {
    console.log("Staff invite email sent", {
        jobId: job.id,
        inviteId: job.data.inviteId,
    });
});
exports.staffInviteWorker.on("failed", (job, error) => {
    console.error("Staff invite email job failed", {
        jobId: job?.id,
        inviteId: job?.data.inviteId,
        error: error.message,
    });
});
