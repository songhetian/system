import { Worker } from 'bullmq';
import { processEmployeeImport, completeExcelTask, failExcelTask } from '../services/excel.service.js';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const importWorker = new Worker(
  'excel-import',
  async (job) => {
    const { taskId, rows } = job.data;
    await processEmployeeImport(taskId, rows);
  },
  { connection, concurrency: 2 },
);

importWorker.on('completed', async (job) => {
  const { taskId, rows } = job.data;
  await completeExcelTask(taskId);
});

importWorker.on('failed', async (job, err) => {
  if (job) {
    const { taskId } = job.data;
    await failExcelTask(taskId, err?.message);
  }
});

export { importWorker };
