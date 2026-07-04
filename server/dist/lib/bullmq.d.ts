import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';
export declare const importQueue: Queue<any, any, string, any, any, string>;
export declare const scheduleQueue: Queue<any, any, string, any, any, string>;
export declare const notificationQueue: Queue<any, any, string, any, any, string>;
export declare function addJob(queue: Queue, name: string, data: Record<string, any>): Promise<string>;
export declare function getJobStatus(queue: Queue, jobId: string): Promise<string>;
export { Queue, Worker, type Job };
//# sourceMappingURL=bullmq.d.ts.map