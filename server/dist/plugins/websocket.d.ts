import type { FastifyInstance } from 'fastify';
export interface NotificationPayload {
    type: 'workflow' | 'leave' | 'overtime' | 'expense' | 'system';
    title: string;
    content: string;
    data: Record<string, any>;
}
export declare function registerWebSocket(app: FastifyInstance): void;
export declare function sendNotification(userId: number, payload: NotificationPayload): Promise<void>;
export declare function sendNotificationToMultiple(userIds: number[], payload: NotificationPayload): Promise<void>;
//# sourceMappingURL=websocket.d.ts.map