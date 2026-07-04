import { z } from 'zod';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { zKbDocumentCreate, zKbDocument, zKbDocumentQuery, zKbPreviewUrl, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createKbDocument, getKbDocumentById, listKbDocuments, deleteKbDocument, getKbPreviewUrl, } from '../services/kb.service.js';
import { checkFileAccess, updateDocumentSecurity, fileSecurityLevels, } from '../services/file-security.service.js';
import { prisma } from '../lib/prisma.js';
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
const zSecurityUpdate = z.object({
    securityLevel: z.enum(['PUBLIC', 'INTERNAL', 'SENSITIVE', 'CONFIDENTIAL']),
    allowedUserIds: z.array(z.number().int()),
    allowedRoleIds: z.array(z.number().int()),
});
const zKbDocumentWithSecurity = zKbDocument.extend({
    securityLevel: z.string(),
    allowedUserIds: z.array(z.number()),
    allowedRoleIds: z.array(z.number()),
});
const zFileSecurityLevel = z.object({
    value: z.string(),
    label: z.string(),
    description: z.string(),
});
function toDocumentView(doc) {
    return {
        ...doc,
        createdAt: doc.createdAt?.toISOString() ?? null,
        updatedAt: doc.updatedAt?.toISOString() ?? null,
    };
}
export const kbRoutes = async (app) => {
    // 模块级权限：GET → kb:read，其他 → kb:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'kb:read' : 'kb:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/documents', {
        schema: {
            response: { 200: createResponseSchema(zKbDocument) },
        },
    }, async (request, reply) => {
        try {
            // 兼容 JSON 创建（不带文件上传）
            if (!request.isMultipart()) {
                const body = zKbDocumentCreate.parse(request.body);
                const doc = await createKbDocument({
                    ...body,
                    fileName: body.fileName || `${Date.now()}.txt`,
                    fileSize: body.fileSize || 0,
                    fileUrl: body.fileUrl || '',
                }, request.user.id, request.user.username);
                return { code: 0, data: toDocumentView(doc), message: 'success' };
            }
            // 文件上传模式
            let title = '';
            let category = 'OTHER';
            const data = await request.file();
            if (!data)
                throw new Error('未上传文件');
            // 解析额外表单字段
            for (const field in data.fields) {
                if (field === 'title')
                    title = data.fields[field]?.value || '';
                if (field === 'category')
                    category = data.fields[field]?.value || 'OTHER';
            }
            const filename = data.filename || `file_${Date.now()}`;
            const uploadDir = join(process.cwd(), 'uploads');
            if (!existsSync(uploadDir))
                mkdirSync(uploadDir, { recursive: true });
            const filePath = join(uploadDir, `${Date.now()}_${filename}`);
            await pipeline(data.file, createWriteStream(filePath));
            const doc = await createKbDocument({
                title: title || filename,
                category: category,
                fileName: filename,
                fileSize: data.file.bytesRead,
                fileUrl: `/uploads/${filePath.split('/').pop()}`,
            }, request.user.id, request.user.username);
            return { code: 0, data: toDocumentView(doc), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/documents', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zKbDocument) },
        },
    }, async (request, reply) => {
        const query = zKbDocumentQuery.parse(request.query);
        const result = await listKbDocuments(query);
        return {
            code: 0,
            data: { ...result, list: result.list.map(toDocumentView) },
            message: 'success',
        };
    });
    app.get('/documents/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zKbDocument) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const doc = await getKbDocumentById(Number(id));
        return { code: 0, data: doc ? toDocumentView(doc) : null, message: 'success' };
    });
    app.delete('/documents/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteKbDocument(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    app.get('/documents/:id/preview', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zKbPreviewUrl) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const url = await getKbPreviewUrl(Number(id));
            return { code: 0, data: url, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    // 更新文件安全等级
    app.post('/documents/:id/security', {
        schema: {
            params: idParamsSchema,
            body: zodToSchema(zSecurityUpdate),
            response: { 200: createResponseSchema(zKbDocumentWithSecurity) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zSecurityUpdate.parse(request.body);
        try {
            const doc = await updateDocumentSecurity(Number(id), body.securityLevel, body.allowedUserIds, body.allowedRoleIds);
            return { code: 0, data: toDocumentView(doc), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    // 检查文件访问权限
    app.post('/documents/:id/check-access', {
        schema: {
            params: idParamsSchema,
            response: {
                200: createResponseSchema(z.object({ allowed: z.boolean(), reason: z.string().optional() })),
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const user = request.user;
        const secondPasswordVerifiedAt = Number(request.headers['x-second-password-verified-at']) || undefined;
        // 查用户角色
        const userRoles = await prisma.userRole.findMany({
            where: { userId: user.id },
            select: { roleId: true },
        });
        try {
            const result = await checkFileAccess(Number(id), {
                userId: user.id,
                roleIds: userRoles.map((ur) => ur.roleId),
                hasSecondPasswordVerified: secondPasswordVerifiedAt !== undefined,
                secondPasswordVerifiedAt,
            });
            return { code: 0, data: result, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    // 获取安全等级列表
    app.get('/security-levels', {
        schema: {
            response: { 200: createResponseSchema(z.array(zFileSecurityLevel)) },
        },
    }, async () => {
        return { code: 0, data: fileSecurityLevels, message: 'success' };
    });
};
//# sourceMappingURL=kb.js.map