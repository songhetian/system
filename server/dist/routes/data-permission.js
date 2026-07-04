import { z } from 'zod';
import { zDataPermissionCreate, zDataPermissionUpdate, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createDataPermission, listDataPermissions, getDataPermission, updateDataPermission, deleteDataPermission, } from '../services/data-permission.service.js';
// ponytail: Prisma Date → schema 期望的 ISO datetime string
function toDataPermissionView(perm) {
    return {
        ...perm,
        createdAt: perm.createdAt?.toISOString() ?? null,
        updatedAt: perm.updatedAt?.toISOString() ?? null,
    };
}
const zDataPermission = z.object({
    id: z.number(),
    userId: z.number().nullable(),
    roleId: z.number().nullable(),
    resourceType: z.string(),
    scope: z.string(),
    departmentId: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
export const dataPermissionRoutes = async (app) => {
    // 模块级权限：GET → data_permission:read，其他 → data_permission:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'data_permission:read' : 'data_permission:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/', {
        schema: {
            body: zodToSchema(zDataPermissionCreate),
            response: { 200: createResponseSchema(zDataPermission) },
        },
    }, async (request, reply) => {
        const body = zDataPermissionCreate.parse(request.body);
        try {
            const perm = await createDataPermission(body);
            return { code: 0, data: toDataPermissionView(perm), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zDataPermission) },
        },
    }, async (request, reply) => {
        const q = request.query;
        const page = Number(q.page) || 1;
        const pageSize = Number(q.pageSize) || 20;
        const result = await listDataPermissions({
            page,
            pageSize,
            userId: q.userId ? Number(q.userId) : undefined,
            roleId: q.roleId ? Number(q.roleId) : undefined,
            resourceType: q.resourceType || undefined,
        });
        return {
            code: 0,
            data: { total: result.total, list: result.items.map(toDataPermissionView), page, pageSize },
            message: 'success',
        };
    });
    app.get('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zDataPermission.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const perm = await getDataPermission(Number(id));
        return { code: 0, data: toDataPermissionView(perm), message: 'success' };
    });
    app.put('/:id', {
        schema: {
            params: idParamsSchema,
            body: zodToSchema(zDataPermissionUpdate),
            response: { 200: createResponseSchema(zDataPermission) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zDataPermissionUpdate.parse(request.body);
        try {
            const perm = await updateDataPermission(Number(id), body);
            return { code: 0, data: toDataPermissionView(perm), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.delete('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteDataPermission(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
};
//# sourceMappingURL=data-permission.js.map