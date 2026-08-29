import { Job, Worker } from "bullmq";
import { redisConnection } from "@/config/redis";
import { transporter } from "@/utils/mailer";
import {
  SEND_STAFF_INVITE_EMAIL_JOB,
  SendStaffInviteEmailData,
  STAFF_INVITE_QUEUE_NAME,
} from "@/queues/staff-invite.queue";

const processStaffInviteJob = async (
  job: Job<SendStaffInviteEmailData>,
) => {
  if (job.name !== SEND_STAFF_INVITE_EMAIL_JOB) {
    throw new Error(`Unknown staff invite job: ${job.name}`);
  }

  const { email, shopName, role, inviteUrl, expiresAt } = job.data;
  await transporter.sendMail({
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

export const staffInviteWorker = new Worker<SendStaffInviteEmailData>(
  STAFF_INVITE_QUEUE_NAME,
  processStaffInviteJob,
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

staffInviteWorker.on("completed", (job) => {
  console.log("Staff invite email sent", {
    jobId: job.id,
    inviteId: job.data.inviteId,
  });
});

staffInviteWorker.on("failed", (job, error) => {
  console.error("Staff invite email job failed", {
    jobId: job?.id,
    inviteId: job?.data.inviteId,
    error: error.message,
  });
});
