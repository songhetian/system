import { z } from 'zod';
import { zSalaryStructureCreate, zSalaryStructure, zSalaryStructureAssign, zPayslipGenerate, zPayslipListItem, zPayslipFullDetail, zPayslipQuery, zSalaryAuditLog, zSalaryAuditLogQuery, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createSalaryStructure, getSalaryStructureById, listSalaryStructures, updateSalaryStructure, deleteSalaryStructure, assignSalaryStructure, generatePayslips, listPayslips, getPayslipById, listSalaryAuditLogs, } from '../services/salary.service.js';
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
function toStructureView(structure) {
    return {
        ...structure,
        createdAt: structure.createdAt?.toISOString() ?? null,
        updatedAt: structure.updatedAt?.toISOString() ?? null,
    };
}
export const salaryRoutes = async (app) => {
    // 模块级权限：GET → salary:read，其他 → salary:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'salary:read' : 'salary:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    // ─── 薪资结构 ───────────────────────────────────────────────
    app.post('/structures', {
        schema: {
            response: { 200: createResponseSchema(zSalaryStructure) },
        },
    }, async (request, reply) => {
        try {
            const body = zSalaryStructureCreate.parse(request.body);
            const structure = await createSalaryStructure(body);
            return { code: 0, data: toStructureView(structure), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/structures', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zSalaryStructure) },
        },
    }, async (request, reply) => {
        const query = request.query;
        const result = await listSalaryStructures(Number(query.page) || 1, Number(query.pageSize) || 10);
        return {
            code: 0,
            data: { ...result, list: result.list.map(toStructureView) },
            message: 'success',
        };
    });
    app.get('/structures/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zSalaryStructure) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const structure = await getSalaryStructureById(Number(id));
        return { code: 0, data: structure ? toStructureView(structure) : null, message: 'success' };
    });
    app.put('/structures/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zSalaryStructure) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const structure = await updateSalaryStructure(Number(id), request.body);
            return { code: 0, data: toStructureView(structure), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.delete('/structures/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteSalaryStructure(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    app.post('/structures/:id/assign', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.object({ count: z.number() })) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zSalaryStructureAssign.parse(request.body);
            const result = await assignSalaryStructure(Number(id), body.employeeIds);
            return { code: 0, data: result, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    // ─── 工资条 ─────────────────────────────────────────────────
    app.post('/payslips/generate', {
        schema: {
            response: { 200: createResponseSchema(z.object({ count: z.number() })) },
        },
    }, async (request, reply) => {
        try {
            const body = zPayslipGenerate.parse(request.body);
            const result = await generatePayslips(body);
            return { code: 0, data: result, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/payslips', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zPayslipListItem) },
        },
    }, async (request, reply) => {
        const query = zPayslipQuery.parse(request.query);
        const result = await listPayslips(query);
        return {
            code: 0,
            data: {
                ...result,
                list: result.list.map((p) => ({
                    ...p,
                    grossPay: '****',
                    deductions: '****',
                    netPay: '****',
                })),
            },
            message: 'success',
        };
    });
    app.get('/payslips/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zPayslipFullDetail) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const payslip = await getPayslipById(Number(id));
        if (!payslip) {
            return { code: 0, data: null, message: 'success' };
        }
        return {
            code: 0,
            data: {
                ...payslip,
                grossPay: Number(payslip.grossPay),
                deductions: Number(payslip.deductions),
                netPay: Number(payslip.netPay),
                generatedAt: payslip.generatedAt?.toISOString() ?? null,
            },
            message: 'success',
        };
    });
    // ─── 审计日志 ───────────────────────────────────────────────
    app.get('/audit-logs', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zSalaryAuditLog) },
        },
    }, async (request, reply) => {
        const query = zSalaryAuditLogQuery.parse(request.query);
        const result = await listSalaryAuditLogs(query);
        return {
            code: 0,
            data: {
                ...result,
                list: result.list.map((log) => ({
                    ...log,
                    createdAt: log.createdAt?.toISOString() ?? null,
                })),
            },
            message: 'success',
        };
    });
};
//# sourceMappingURL=salary.js.map