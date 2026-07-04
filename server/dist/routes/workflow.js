import { z } from 'zod';
import { zWorkflowTemplateCreate, zWorkflowTemplate, zWorkflowInstance, zWorkflowInstanceCreate, zWorkflowApprove, zWorkflowReject, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createWorkflowTemplate, getWorkflowTemplateById, listWorkflowTemplates, updateWorkflowTemplate, deleteWorkflowTemplate, publishWorkflowTemplate, createWorkflowInstance, getWorkflowInstanceById, listWorkflowInstances, approveWorkflowInstance, rejectWorkflowInstance, returnWorkflowInstance, } from '../services/workflow.service.js';
function toTemplateView(template) {
    return {
        ...template,
        createdAt: template.createdAt?.toISOString() ?? null,
        updatedAt: template.updatedAt?.toISOString() ?? null,
        deletedAt: template.deletedAt?.toISOString() ?? null,
    };
}
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
export const workflowRoutes = async (app) => {
    // 模块级权限：GET → workflow:read，其他 → workflow:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'workflow:read' : 'workflow:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/templates', {
        schema: {
            response: { 200: createResponseSchema(zWorkflowTemplate) },
        },
    }, async (request, reply) => {
        try {
            const body = zWorkflowTemplateCreate.parse(request.body);
            const template = await createWorkflowTemplate(body);
            return { code: 0, data: toTemplateView(template), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/templates', {
        schema: {
            querystring: zodToSchema(z.object({ page: z.string().optional(), pageSize: z.string().optional() })),
        },
    }, async (request, reply) => {
        try {
            const query = request.query;
            const result = await listWorkflowTemplates(Number(query.page) || 1, Number(query.pageSize) || 10);
            return {
                code: 0,
                data: { ...result, list: result.list.map(toTemplateView) },
                message: 'success',
            };
        }
        catch (err) {
            reply.status(500);
            return { code: 10000, data: null, message: err.message || '服务器错误' };
        }
    });
    app.get('/templates/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowTemplate.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const template = await getWorkflowTemplateById(Number(id));
        return { code: 0, data: template ? toTemplateView(template) : null, message: 'success' };
    });
    app.put('/templates/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowTemplate) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const template = await updateWorkflowTemplate(Number(id), request.body);
            return { code: 0, data: toTemplateView(template), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.delete('/templates/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteWorkflowTemplate(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    app.post('/templates/:id/publish', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowTemplate) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const template = await publishWorkflowTemplate(Number(id));
            return { code: 0, data: toTemplateView(template), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/instances', {
        schema: {
            response: { 200: createResponseSchema(zWorkflowInstance) },
        },
    }, async (request, reply) => {
        try {
            const body = zWorkflowInstanceCreate.parse(request.body);
            const instance = await createWorkflowInstance(body);
            return { code: 0, data: toInstanceView(instance), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/instances', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zWorkflowInstance) },
        },
    }, async (request, reply) => {
        const query = request.query;
        const result = await listWorkflowInstances(Number(query.page) || 1, Number(query.pageSize) || 10);
        return {
            code: 0,
            data: { ...result, list: result.list.map(toInstanceView) },
            message: 'success',
        };
    });
    app.get('/instances/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowInstance.nullable()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const instance = await getWorkflowInstanceById(Number(id));
        return { code: 0, data: instance ? toInstanceView(instance) : null, message: 'success' };
    });
    app.post('/instances/:id/approve', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowInstance) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zWorkflowApprove.parse(request.body);
            const instance = await approveWorkflowInstance(Number(id), body.comment || '');
            return { code: 0, data: toInstanceView(instance), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/instances/:id/reject', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowInstance) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zWorkflowReject.parse(request.body);
            const instance = await rejectWorkflowInstance(Number(id), body.reason);
            return { code: 0, data: toInstanceView(instance), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/instances/:id/return', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zWorkflowInstance) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        try {
            const instance = await returnWorkflowInstance(Number(id), body.targetType, body.reason || '', body.targetNodeIndex);
            return { code: 0, data: toInstanceView(instance), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
};
function toInstanceView(instance) {
    return {
        ...instance,
        createdAt: instance.createdAt?.toISOString() ?? null,
        updatedAt: instance.updatedAt?.toISOString() ?? null,
        nodes: instance.nodes?.map((node) => ({
            ...node,
            operatedAt: node.operatedAt?.toISOString() ?? null,
        })) ?? [],
    };
}
//# sourceMappingURL=workflow.js.map