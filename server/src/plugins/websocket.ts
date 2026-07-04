import type { FastifyInstance, FastifyRequest } from 'fastify';
import ws from '@fastify/websocket';
import { prisma } from '../lib/prisma.js';

interface UserConnection {
  userId: number;
  socket: any;
}

const connections: Map<string, UserConnection> = new Map();
const userConnections: Map<number, Set<string>> = new Map();

export interface NotificationPayload {
  type: 'workflow' | 'leave' | 'overtime' | 'expense' | 'system';
  title: string;
  content: string;
  data: Record<string, any>;
}

export function registerWebSocket(app: FastifyInstance) {
  app.register(ws);

  app.get(
    '/ws',
    { websocket: true },
    async (connection: any, request: FastifyRequest) => {
      const token = (request.query as any)?.token || request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        connection.socket.close(1008, 'Unauthorized');
        return;
      }

      let userId: number | null = null;
      try {
        const decoded = await request.jwtVerify<{ id: number }>({ token });
        userId = decoded.id;
      } catch {
        connection.socket.close(1008, 'Invalid token');
        return;
      }

      const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      connections.set(connectionId, { userId, socket: connection.socket });

      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId)!.add(connectionId);

      connection.socket.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'ping') {
            connection.socket.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {}
      });

      connection.socket.on('close', () => {
        connections.delete(connectionId);
        const userConns = userConnections.get(userId!);
        if (userConns) {
          userConns.delete(connectionId);
          if (userConns.size === 0) {
            userConnections.delete(userId!);
          }
        }
      });
    },
  );
}

export async function sendNotification(userId: number, payload: NotificationPayload) {
  // 写入消息表 — 离线用户下次登录可查看
  try {
    await prisma.message.create({
      data: {
        userId,
        type: 'TODO',
        title: payload.title,
        content: payload.content,
        sourceType: payload.type,
        sourceId: payload.data?.sourceId || null,
        read: false,
      },
    });
  } catch {}

  // 在线用户实时推送
  const userConns = userConnections.get(userId);
  if (!userConns || userConns.size === 0) return;

  const message = JSON.stringify({
    type: 'notification',
    payload,
    timestamp: Date.now(),
  });

  for (const connId of userConns) {
    const conn = connections.get(connId);
    if (conn) {
      try {
        conn.socket.send(message);
      } catch {
        connections.delete(connId);
        userConns.delete(connId);
      }
    }
  }
}

export async function sendNotificationToMultiple(userIds: number[], payload: NotificationPayload) {
  for (const userId of userIds) {
    await sendNotification(userId, payload);
  }
}