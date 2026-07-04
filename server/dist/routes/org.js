import { z } from 'zod';
import { zDepartmentCreate, zDepartmentUpdate, zDepartment, zDepartmentQuery, zDepartmentTree, zRankCreate, zRankUpdate, zRank, zPositionCreate, zPositionUpdate, zPosition, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createDepartment, getDepartmentById, listDepartments, updateDepartment, deleteDepartment, getDepartmentTree, } from '../services/department.service.js';
import { createRank, getRankById, listRanks, updateRank, deleteRank, } from '../services/rank.service.js';
import { createPosition, getPositionById, listPositions, updatePosition, deletePosition, } from '../services/position.service.js';
export const orgRoutes = async (app) => {
    // 模块级权限：GET → org:read，其他 → org:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'org:read' : 'org:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    // 部门管理
    app.post('/departments', {
        schema: {
            body: zodToSchema(zDepartmentCreate),
            response: { 200: createResponseSchema(zDepartment) },
        },
    }, async (request, reply) => {
        const body = zDepartmentCreate.parse(request.body);
        try {
            const dept = await createDepartment(body);
            return { code: 0, data: dept, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 30000, data: null, message: err.message };
        }
    });
    app.get('/departments', {
        schema: {
            querystring: zodToSchema(zDepartmentQuery),
            response: { 200: createPaginatedResponseSchema(zDepartment) },
        },
    }, async (request, reply) => {
        const query = zDepartmentQuery.parse(request.query);
        const result = await listDepartments(query);
        return { code: 0, data: result, message: 'success' };
    });
    app.get('/departments/tree', {
        schema: {
            response: { 200: createResponseSchema(zDepartmentTree) },
        },
    }, async (request, reply) => {
        const tree = await getDepartmentTree();
        return { code: 0, data: tree, message: 'success' };
    });
    app.get('/departments/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: { 200: createResponseSchema(zDepartment.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const dept = await getDepartmentById(Number(id));
        return { code: 0, data: dept, message: 'success' };
    });
    app.put('/departments/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zDepartmentUpdate),
            response: { 200: createResponseSchema(zDepartment) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zDepartmentUpdate.parse(request.body);
        try {
            const dept = await updateDepartment(Number(id), body);
            return { code: 0, data: dept, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 30000, data: null, message: err.message };
        }
    });
    app.delete('/departments/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteDepartment(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    // 职级管理
    app.post('/ranks', {
        schema: {
            body: zodToSchema(zRankCreate),
            response: { 200: createResponseSchema(zRank) },
        },
    }, async (request, reply) => {
        const body = zRankCreate.parse(request.body);
        try {
            const rank = await createRank(body);
            return { code: 0, data: rank, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 30100, data: null, message: err.message };
        }
    });
    app.get('/ranks', {
        schema: {
            response: { 200: createResponseSchema(z.array(zRank)) },
        },
    }, async (request, reply) => {
        const ranks = await listRanks();
        return { code: 0, data: ranks, message: 'success' };
    });
    app.get('/ranks/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: { 200: createResponseSchema(zRank.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const rank = await getRankById(Number(id));
        return { code: 0, data: rank, message: 'success' };
    });
    app.put('/ranks/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zRankUpdate),
            response: { 200: createResponseSchema(zRank) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zRankUpdate.parse(request.body);
        try {
            const rank = await updateRank(Number(id), body);
            return { code: 0, data: rank, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 30100, data: null, message: err.message };
        }
    });
    app.delete('/ranks/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteRank(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    // 岗位管理
    app.post('/positions', {
        schema: {
            body: zodToSchema(zPositionCreate),
            response: { 200: createResponseSchema(zPosition) },
        },
    }, async (request, reply) => {
        const body = zPositionCreate.parse(request.body);
        try {
            const pos = await createPosition(body.departmentId, body);
            return { code: 0, data: pos, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 30200, data: null, message: err.message };
        }
    });
    app.get('/positions', {
        schema: {
            querystring: zodToSchema(z.object({
                page: z.coerce.number().int().min(1).default(1),
                pageSize: z.coerce.number().int().min(1).max(100).default(10),
                departmentId: z.coerce.number().int().positive().optional(),
                keyword: z.string().max(200).optional(),
            })),
            response: { 200: createPaginatedResponseSchema(zPosition) },
        },
    }, async (request, reply) => {
        const query = request.query;
        const result = await listPositions({
            page: Number(query.page) || 1,
            pageSize: Number(query.pageSize) || 10,
            departmentId: query.departmentId ? Number(query.departmentId) : undefined,
            keyword: query.keyword,
        });
        return { code: 0, data: result, message: 'success' };
    });
    app.get('/positions/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: { 200: createResponseSchema(zPosition.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const pos = await getPositionById(Number(id));
        return { code: 0, data: pos, message: 'success' };
    });
    app.put('/positions/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zPositionUpdate),
            response: { 200: createResponseSchema(zPosition) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = zPositionUpdate.parse(request.body);
        try {
            const pos = await updatePosition(Number(id), body);
            return { code: 0, data: pos, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 30200, data: null, message: err.message };
        }
    });
    app.delete('/positions/:id', {
        schema: {
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deletePosition(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
};
//# sourceMappingURL=org.js.map