import { prisma } from '../lib/prisma.js';
import { sanitizeContent } from '../lib/sanitize.js';
export async function createMessage(data) {
    return prisma.message.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            content: sanitizeContent(data.content),
            sourceType: data.sourceType,
            sourceId: data.sourceId,
        },
    });
}
export async function getMessageById(id) {
    return prisma.message.findUnique({ where: { id } });
}
export async function listMessages(query) {
    const { page = 1, pageSize = 10, userId, read, type } = query;
    const where = {};
    if (userId)
        where.userId = userId;
    if (read !== undefined)
        where.read = read;
    if (type)
        where.type = type;
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
export async function markMessageRead(id) {
    return prisma.message.update({
        where: { id },
        data: { read: true },
    });
}
export async function markAllMessagesRead(userId) {
    const result = await prisma.message.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
    return { count: result.count };
}
export async function deleteMessage(id) {
    await prisma.message.delete({ where: { id } });
}
export async function getUnreadCount(userId) {
    return prisma.message.count({ where: { userId, read: false } });
}
// ═══════════════════ 公告 ═══════════════════
export async function createAnnouncement(data) {
    return prisma.announcement.create({
        data: {
            title: data.title,
            content: sanitizeContent(data.content),
            targetType: data.targetType,
            targetIds: data.targetIds,
            attachments: data.attachments,
            publisherId: data.publisherId,
            publisherName: data.publisherName,
        },
    });
}
export async function getAnnouncementById(id) {
    return prisma.announcement.findUnique({ where: { id } });
}
export async function listAnnouncements(query) {
    const { page = 1, pageSize = 10, status, targetDepartmentId } = query;
    const where = { deletedAt: null };
    if (status)
        where.status = status;
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
export async function updateAnnouncement(id, data) {
    return prisma.announcement.update({
        where: { id },
        data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.content !== undefined && { content: data.content }),
            ...(data.targetType !== undefined && { targetType: data.targetType }),
            ...(data.targetIds !== undefined && { targetIds: data.targetIds }),
            ...(data.attachments !== undefined && { attachments: data.attachments }),
        },
    });
}
export async function publishAnnouncement(id) {
    return prisma.announcement.update({
        where: { id },
        data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
        },
    });
}
export async function deleteAnnouncement(id) {
    await prisma.announcement.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
//# sourceMappingURL=message.service.js.map