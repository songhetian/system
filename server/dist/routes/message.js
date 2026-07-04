import { z } from 'zod';
import { zMessage, zMessageQuery, zAnnouncement, zAnnouncementCreate, zAnnouncementUpdate, zAnnouncementQuery, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { listMessages, markMessageRead, markAllMessagesRead, deleteMessage, getUnreadCount, createAnnouncement, getAnnouncementById, listAnnouncements, updateAnnouncement, publishAnnouncement, deleteAnnouncement, } from '../services/message.service.js';
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
function toMessageView(msg) {
    return {
        ...msg,
        createdAt: msg.createdAt?.toISOString() ?? null,
    };
}
function toAnnouncementView(ann) {
    return {
        ...ann,
        targetIds: ann.targetIds ?? [],
        attachments: ann.attachments ?? [],
        publishedAt: ann.publishedAt?.toISOString() ?? null,
        createdAt: ann.createdAt?.toISOString() ?? null,
        updatedAt: ann.updatedAt?.toISOString() ?? null,
    };
}
// ═══════════════════ 消息路由 ═══════════════════
export const messageRoutes = async (app) => {
    // 模块级权限：GET → message:read，其他 → message:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'message:read' : 'message:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.get('/', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zMessage) },
        },
    }, async (request, reply) => {
        const query = zMessageQuery.parse(request.query);
        const userId = request.user?.id ?? 1;
        const result = await listMessages({ ...query, userId });
        return { code: 0, data: { ...result, list: result.list.map(toMessageView) }, message: 'success' };
    });
    app.get('/unread-count', {
        schema: {
            response: { 200: createResponseSchema(z.object({ count: z.number() })) },
        },
    }, async (request, reply) => {
        const userId = request.user?.id ?? 1;
        const count = await getUnreadCount(userId);
        return { code: 0, data: { count }, message: 'success' };
    });
    app.post('/:id/read', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zMessage) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const msg = await markMessageRead(Number(id));
        return { code: 0, data: toMessageView(msg), message: 'success' };
    });
    app.post('/read-all', {
        schema: {
            response: { 200: createResponseSchema(z.object({ count: z.number() })) },
        },
    }, async (request, reply) => {
        const userId = request.user?.id ?? 1;
        const result = await markAllMessagesRead(userId);
        return { code: 0, data: result, message: 'success' };
    });
    app.delete('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteMessage(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
};
// ═══════════════════ 公告路由 ═══════════════════
export const announcementRoutes = async (app) => {
    // 模块级权限：GET → message:read，其他 → message:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'message:read' : 'message:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/', {
        schema: {
            response: { 200: createResponseSchema(zAnnouncement) },
        },
    }, async (request, reply) => {
        try {
            const body = zAnnouncementCreate.parse(request.body);
            const userId = request.user?.id ?? 1;
            const username = request.user?.username ?? 'admin';
            const ann = await createAnnouncement({ ...body, publisherId: userId, publisherName: username });
            return { code: 0, data: toAnnouncementView(ann), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zAnnouncement) },
        },
    }, async (request, reply) => {
        const query = zAnnouncementQuery.parse(request.query);
        const result = await listAnnouncements(query);
        return { code: 0, data: { ...result, list: result.list.map(toAnnouncementView) }, message: 'success' };
    });
    app.get('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zAnnouncement) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const ann = await getAnnouncementById(Number(id));
        return { code: 0, data: ann ? toAnnouncementView(ann) : null, message: 'success' };
    });
    app.put('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zAnnouncement) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zAnnouncementUpdate.parse(request.body);
            const ann = await updateAnnouncement(Number(id), body);
            return { code: 0, data: toAnnouncementView(ann), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/:id/publish', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zAnnouncement) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const ann = await publishAnnouncement(Number(id));
        return { code: 0, data: toAnnouncementView(ann), message: 'success' };
    });
    app.delete('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteAnnouncement(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
};
//# sourceMappingURL=message.js.map