import { Job, Worker } from "bullmq";
import { redisConnection } from "@/config/redis";
import { sendVerificationEmailService } from "@/service/auth/auth.service";

const EMAIL_QUEUE_NAME = "email";
const SEND_VERIFICATION_EMAIL_JOB = "sendVerificationEmail";
interface SendVerificationEmailData {
  userId: string;
  email: string;
  name?: string;
  token: string;
}

const processEmailJob = async (job: Job<SendVerificationEmailData>) => {
  switch (job.name) {
    case SEND_VERIFICATION_EMAIL_JOB: {
      const { userId, email, name, token } = job.data;

      await sendVerificationEmailService({
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

export const emailWorker = new Worker<SendVerificationEmailData>(
  EMAIL_QUEUE_NAME,
  processEmailJob,
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, error) => {
  console.error("Email job failed", {
    jobId: job?.id,
    jobName: job?.name,
    error: error.message,
  });
});
