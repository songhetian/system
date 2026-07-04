import { z } from 'zod';
import { zRoleCreate, zRoleUpdate, zRole, zRoleQuery, zRolePermissionAssign, zPermission, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createRole, getRoleById, listRoles, updateRole, deleteRole, assignRolePermissions, getRolePermissions, } from '../services/role.service.js';
// ponytail: Prisma Date → schema 期望的 ISO datetime string
function toRoleView(role) {
    return {
        ...role,
        createdAt: role.createdAt?.toISOString() ?? null,
        updatedAt: role.updatedAt?.toISOString() ?? null,
        deletedAt: role.deletedAt?.toISOString() ?? null,
    };
}
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
export const roleRoutes = async (app) => {
    // 模块级权限：GET → role:read，其他 → role:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'role:read' : 'role:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/', {
        schema: {
            body: zodToSchema(zRoleCreate),
            response: { 200: createResponseSchema(zRole) },
        },
    }, async (request, reply) => {
        const body = zRoleCreate.parse(request.body);
        try {
            const role = await createRole(body);
            return { code: 0, data: toRoleView(role), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/', {
        schema: {
            querystring: zodToSchema(zRoleQuery),
            response: { 200: createPaginatedResponseSchema(zRole) },
        },
    }, async (request, reply) => {
        const query = zRoleQuery.parse(request.query);
        const result = await listRoles(query);
        return {
            code: 0,
            data: { ...result, list: result.list.map(toRoleView) },
            message: 'success',
        };
    });
    app.get('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zRole.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const role = await getRoleById(Number(id));
        return { code: 0, data: role ? toRoleView(role) : null, message: 'success' };
    });
    app.put('/:id', {
        schema: {
            params: idParamsSchema,
            body: zodToSchema(zRoleUpdate),
            response: { 200: createResponseSchema(zRole) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zRoleUpdate.parse(request.body);
        try {
            const role = await updateRole(Number(id), body);
            return { code: 0, data: toRoleView(role), message: 'success' };
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
        await deleteRole(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    app.put('/:id/permissions', {
        schema: {
            params: idParamsSchema,
            body: zodToSchema(zRolePermissionAssign),
            response: { 200: createResponseSchema(z.number()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zRolePermissionAssign.parse(request.body);
        try {
            const count = await assignRolePermissions(Number(id), body.permissionIds);
            return { code: 0, data: count, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/:id/permissions', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.array(zPermission)) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const permissions = await getRolePermissions(Number(id));
        return { code: 0, data: permissions, message: 'success' };
    });
};
//# sourceMappingURL=role.js.map