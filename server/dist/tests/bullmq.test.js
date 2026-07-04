import { describe, it, expect } from 'vitest';
import { importQueue, addJob, getJobStatus, Worker } from '../lib/bullmq.js';
const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };
describe('BullMQ - 队列系统', () => {
    it('addJob - 添加任务返回 jobId', async () => {
        const jobId = await addJob(importQueue, 'import', { data: 'test' });
        expect(jobId).toBeDefined();
        expect(typeof jobId).toBe('string');
        await importQueue.drain();
    });
    it('getJobStatus - 获取任务状态', async () => {
        const jobId = await addJob(importQueue, 'import', { data: 'test' });
        const status = await getJobStatus(importQueue, jobId);
        expect(['waiting', 'active', 'completed', 'failed']).toContain(status);
        await importQueue.drain();
    });
    it('getJobStatus - 不存在的任务返回 failed', async () => {
        const status = await getJobStatus(importQueue, 'nonexistent');
        expect(status).toBe('failed');
    });
    it('Worker - 任务被处理后变为 completed', async () => {
        const worker = new Worker('bullmq-test', async () => ({ success: true }), { connection });
        const testQueue = new (await import('bullmq')).Queue('bullmq-test', { connection });
        const job = await testQueue.add('test', { data: 'hello' });
        // 等待 worker 处理
        const result = await job.waitUntilFinished(testQueue, 5000);
        expect(result).toEqual({ success: true });
        await worker.close();
        await testQueue.drain();
        await testQueue.close();
    });
});
//# sourceMappingURL=bullmq.test.js.map