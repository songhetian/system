import { prisma } from '../lib/prisma.js';
import { sanitizeContent } from '../lib/sanitize.js';
import type { MessageCreate, MessageQuery, AnnouncementCreate, AnnouncementQuery } from '@shop/shared';

export async function createMessage(data: { userId: number; type: string; title: string; content: string; sourceType?: string; sourceId?: number }) {
  return prisma.message.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      content: sanitizeContent(data.content),
      sourceType: data.sourceType,
      sourceId: data.sourceId,
    },
  });
}

export async function getMessageById(id: number) {
  return prisma.message.findUnique({ where: { id } });
}

export async function listMessages(query: MessageQuery) {
  const { page = 1, pageSize = 10, userId, read, type } = query as any;
  const where: any = {};
  if (userId) where.userId = userId;
  if (read !== undefined) where.read = read;
  if (type) where.type = type;

  const [list, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.message.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function markMessageRead(id: number) {
  return prisma.message.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllMessagesRead(userId: number) {
  const result = await prisma.message.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { count: result.count };
}

export async function deleteMessage(id: number) {
  await prisma.message.delete({ where: { id } });
}

export async function getUnreadCount(userId: number) {
  return prisma.message.count({ where: { userId, read: false } });
}

// ═══════════════════ 公告 ═══════════════════

export async function createAnnouncement(data: AnnouncementCreate & { publisherId: number; publisherName: string }) {
  return prisma.announcement.create({
    data: {
      title: data.title,
      content: sanitizeContent(data.content),
      targetType: data.targetType as any,
      targetIds: data.targetIds as any,
      attachments: data.attachments as any,
      publisherId: data.publisherId,
      publisherName: data.publisherName,
    },
  });
}

export async function getAnnouncementById(id: number) {
  return prisma.announcement.findUnique({ where: { id } });
}

export async function listAnnouncements(query: AnnouncementQuery) {
  const { page = 1, pageSize = 10, status, targetDepartmentId } = query as any;
  const where: any = { deletedAt: null };
  if (status) where.status = status;
  if (targetDepartmentId) {
    where.OR = [
      { targetType: 'ALL' },
      { targetType: 'DEPARTMENT', targetIds: { array_contains: targetDepartmentId } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.announcement.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function updateAnnouncement(id: number, data: Partial<AnnouncementCreate>) {
  return prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.targetType !== undefined && { targetType: data.targetType as any }),
      ...(data.targetIds !== undefined && { targetIds: data.targetIds as any }),
      ...(data.attachments !== undefined && { attachments: data.attachments as any }),
    },
  });
}

export async function publishAnnouncement(id: number) {
  return prisma.announcement.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });
}

export async function deleteAnnouncement(id: number) {
  await prisma.announcement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}