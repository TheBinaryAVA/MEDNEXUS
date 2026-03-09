/**
 * Background Jobs — Email Worker (BullMQ + Redis)
 *
 * Install: npm install bullmq ioredis nodemailer @types/nodemailer
 *
 * This file shows one complete job: welcome email after registration.
 * The same pattern works for: password reset, notifications, report generation, etc.
 */

import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config';
import { logger } from '../config/logger';

// ── Job payload types ──────────────────────────────────

export interface WelcomeEmailPayload {
  userId: string;
  email: string;
  name: string;
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
  resetToken: string;
}

export type EmailJobName = 'welcome' | 'password-reset';

// ── Queue ─────────────────────────────────────────────

export const emailQueue = new Queue<WelcomeEmailPayload | PasswordResetPayload>('email', {
  connection: { url: config.redis.url },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// ── Helpers ───────────────────────────────────────────

export async function enqueueWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
  await emailQueue.add('welcome', payload, { delay: 2000 }); // 2s delay
  logger.info({ userId: payload.userId }, 'Welcome email queued');
}

export async function enqueuePasswordReset(payload: PasswordResetPayload): Promise<void> {
  await emailQueue.add('password-reset', payload);
}

// ── Worker ────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // In prod, swap for nodemailer / SendGrid / Resend SDK
  logger.info({ to, subject }, '[EMAIL] Sending email (mock)');
  // const transporter = nodemailer.createTransport({ ... })
  // await transporter.sendMail({ from: config.email.from, to, subject, html })
}

export function startEmailWorker(): Worker {
  const worker = new Worker<WelcomeEmailPayload | PasswordResetPayload>(
    'email',
    async (job: Job) => {
      const name = job.name as EmailJobName;
      logger.info({ jobId: job.id, name }, 'Processing email job');

      switch (name) {
        case 'welcome': {
          const { email, name: userName } = job.data as WelcomeEmailPayload;
          await sendEmail(
            email,
            'Welcome to MyApp!',
            `<h1>Hi ${userName}, welcome aboard!</h1>`,
          );
          break;
        }
        case 'password-reset': {
          const { email, resetToken } = job.data as PasswordResetPayload;
          const resetUrl = `https://myapp.com/reset-password?token=${resetToken}`;
          await sendEmail(
            email,
            'Reset your password',
            `<p>Click <a href="${resetUrl}">here</a> to reset your password. Expires in 1 hour.</p>`,
          );
          break;
        }
        default:
          logger.warn({ name }, 'Unknown email job type');
      }
    },
    {
      connection: { url: config.redis.url },
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Email job completed'));
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'Email job failed'),
  );

  return worker;
}
