import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis";

export const STAFF_INVITE_QUEUE_NAME = "staff-invite";
export const SEND_STAFF_INVITE_EMAIL_JOB = "sendStaffInviteEmail";

export interface SendStaffInviteEmailData {
  inviteId: string;
  email: string;
  shopName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export const staffInviteQueue = new Queue<SendStaffInviteEmailData>(
  STAFF_INVITE_QUEUE_NAME,
  {
    connection: redisConnection,
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
  },
);
