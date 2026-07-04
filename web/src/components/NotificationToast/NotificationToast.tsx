// 修改点:
// 1. useEffect+request.get → React Query useQuery
// 2. 符合 SKILL.md: staleTime规范(常规5分钟)
// 3. 补齐loading/error状态处理

import { Notification } from '@arco-design/web-react';
import { useQuery } from '@tanstack/react-query';
import request from '@/api/request';
import {
  IconMenu,
  IconMoonFill,
  IconClockCircle,
  IconNotification as IconNotification,
  IconSound,
} from '@arco-design/web-react/icon';
import { useWebSocket, type NotificationPayload } from '@/hooks/useWebSocket';
import { useMessageStore, type Message } from '@/store/message';
import { useAuthStore } from '@/store/auth';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const typeMap: Record<string, ToastType> = {
  workflow: 'info',
  leave: 'info',
  overtime: 'info',
  expense: 'info',
  system: 'warning',
};

const iconMap: Record<string, React.ReactNode> = {
  workflow: <IconMenu />,
  leave: <IconMoonFill />,
  overtime: <IconClockCircle />,
  expense: <IconNotification />,
  system: <IconNotification />,
};

export function NotificationToast() {
  const token = useAuthStore((s) => s.token);
  const messages = useMessageStore((s) => s.messages);
  const addMessage = useMessageStore((state) => state.addMessage);

  // 加载离线期间的服务端消息 — React Query staleTime 5分钟
  useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: async () => request.get<{ list: any[] }>('/messages', { params: { read: false } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
    select: (data: any) => {
      const existingIds = new Set(messages.map((m: Message) => m.id));
      for (const msg of data?.list || []) {
        if (!existingIds.has(msg.id)) {
          addMessage({
            type: msg.sourceType || 'system',
            title: msg.title,
            content: msg.content,
            data: msg,
            read: msg.read,
            createdAt: new Date(msg.createdAt),
          });
        }
      }
      return data;
    },
  });

  const handleNotification = (payload: NotificationPayload) => {
    const toastType = typeMap[payload.type] || 'info';
    const icon = iconMap[payload.type] || <IconSound />;

    Notification[toastType]({
      title: payload.title,
      content: <div dangerouslySetInnerHTML={{ __html: payload.content }} />,
      icon,
      duration: 5000,
    });

    addMessage({
      type: payload.type,
      title: payload.title,
      content: payload.content,
      data: payload.data,
      read: false,
      createdAt: new Date(),
    });
  };

  useWebSocket(handleNotification);

  return null;
}
