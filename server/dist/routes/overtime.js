import { z } from 'zod';
import { zOvertimeRequestCreate, zOvertimeRequestUpdate, zOvertimeRequest, zOvertimeRequestQuery, zOvertimeRecordCreate, zOvertimeRecord, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createOvertimeRequest, listOvertimeRequests, getOvertimeRequest, updateOvertimeRequest, approveOvertimeRequest, rejectOvertimeRequest, cancelOvertimeRequest, createOvertimeRecord, listOvertimeRecords, } from '../services/overtime.service.js';
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
function toRequestView(request) {
    return {
        ...request,
        startDateTime: request.startDateTime?.toISOString() ?? null,
        endDateTime: request.endDateTime?.toISOString() ?? null,
        createdAt: request.createdAt?.toISOString() ?? null,
        updatedAt: request.updatedAt?.toISOString() ?? null,
    };
}
function toRecordView(record) {
    return {
        ...record,
        actualStart: record.actualStart?.toISOString() ?? null,
        actualEnd: record.actualEnd?.toISOString() ?? null,
        createdAt: record.createdAt?.toISOString() ?? null,
    };
}
export const overtimeRoutes = async (app) => {
    // 模块级权限：GET → overtime:read，其他 → overtime:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'overtime:read' : 'overtime:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/', {
        schema: {
            response: { 200: createResponseSchema(zOvertimeRequest) },
        },
    }, async (request, reply) => {
        try {
            const body = zOvertimeRequestCreate.parse(request.body);
            const result = await createOvertimeRequest(body);
            return { code: 0, data: toRequestView(result), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zOvertimeRequest) },
        },
    }, async (request) => {
        const query = zOvertimeRequestQuery.parse(request.query);
        const result = await listOvertimeRequests(query);
        return {
            code: 0,
            data: { total: result.total, list: result.items.map(toRequestView), page: query.page, pageSize: query.pageSize },
            message: 'success',
        };
    });
    app.get('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zOvertimeRequest.nullable()) },
        },
    }, async (request) => {
        const { id } = request.params;
        const result = await getOvertimeRequest(Number(id));
        return { code: 0, data: toRequestView(result), message: 'success' };
    });
    app.put('/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zOvertimeRequest) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zOvertimeRequestUpdate.parse(request.body);
            const result = await updateOvertimeRequest(Number(id), body);
            return { code: 0, data: toRequestView(result), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/:id/approve', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zOvertimeRequest) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = request.body;
            const result = await approveOvertimeRequest(Number(id), body?.approvedHours);
            return { code: 0, data: toRequestView(result), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/:id/reject', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zOvertimeRequest) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = request.body;
            const result = await rejectOvertimeRequest(Number(id), body?.reason);
            return { code: 0, data: toRequestView(result), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/:id/cancel', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zOvertimeRequest) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const result = await cancelOvertimeRequest(Number(id));
            return { code: 0, data: toRequestView(result), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/records', {
        schema: {
            response: { 200: createResponseSchema(zOvertimeRecord) },
        },
    }, async (request, reply) => {
        try {
            const body = zOvertimeRecordCreate.parse(request.body);
            const result = await createOvertimeRecord(body);
            return { code: 0, data: toRecordView(result), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/records', {
        schema: {
            response: { 200: createResponseSchema(z.array(zOvertimeRecord)) },
        },
    }, async (request) => {
        const query = request.query;
        const result = await listOvertimeRecords(query?.employeeId, query?.requestId);
        return { code: 0, data: result.map(toRecordView), message: 'success' };
    });
};
//# sourceMappingURL=overtime.js.map