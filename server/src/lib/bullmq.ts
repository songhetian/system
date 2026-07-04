import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const importQueue = new Queue('excel-import', { connection });
export const scheduleQueue = new Queue('schedule-generate', { connection });
export const notificationQueue = new Queue('notifications', { connection });

export async function addJob(queue: Queue, name: string, data: Record<string, any>): Promise<string> {
  const job = await queue.add(name, data);
  return job.id || '';
}

export async function getJobStatus(queue: Queue, jobId: string): Promise<string> {
  const job = await queue.getJob(jobId);
  if (!job) return 'failed';
  return (await job.isCompleted()) ? 'completed' : (await job.isFailed()) ? 'failed' : 'active';
}

export { Queue, Worker, type Job };
