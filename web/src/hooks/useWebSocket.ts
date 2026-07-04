import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';

export interface NotificationPayload {
  type: 'workflow' | 'leave' | 'overtime' | 'expense' | 'system';
  title: string;
  content: string;
  data: Record<string, any>;
}

interface WebSocketMessage {
  type: 'notification' | 'pong';
  payload?: NotificationPayload;
  timestamp?: number;
}

export function useWebSocket(onNotification?: (payload: NotificationPayload) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const token = useAuthStore((state) => state.token);

  const connect = useCallback(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'ping' }));
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'notification' && message.payload) {
          onNotification?.(message.payload);
        }
      } catch {}
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      socketRef.current = null;
      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [token, onNotification]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    send: (data: Record<string, any>) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
      }
    },
    disconnect: () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    },
  };
}