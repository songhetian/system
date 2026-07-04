import { z } from 'zod';
import { zExcelModule, zImportProgress, zExcelTask } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createExcelTask, getExcelTaskById, listExcelTasks, processEmployeeImport, completeExcelTask, } from '../services/excel.service.js';
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
function toTaskView(task) {
    return {
        ...task,
        createdAt: task.createdAt?.toISOString() ?? null,
        updatedAt: task.updatedAt?.toISOString() ?? null,
    };
}
export const excelRoutes = async (app) => {
    // 模块级权限：GET → excel:read，其他 → excel:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'excel:read' : 'excel:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    // POST /api/excel/import/:module - 上传 Excel 导入
    app.post('/import/:module', {
        schema: {
            params: zodToSchema(z.object({ module: zExcelModule })),
            response: { 200: createResponseSchema(zImportProgress) },
        },
    }, async (request, reply) => {
        const { module } = request.params;
        const userId = request.user?.id ?? 1;
        try {
            const file = await request.file();
            if (!file) {
                reply.status(400);
                return { code: 10000, data: null, message: '未上传文件' };
            }
            const fileName = file.filename;
            const task = await createExcelTask(module, 'IMPORT', fileName, userId);
            // ponytail: 简化实现 - 同步处理导入，实际生产环境应使用队列
            const buffer = await file.toBuffer();
            const rows = parseCsvBuffer(buffer);
            if (module === 'EMPLOYEE') {
                const result = await processEmployeeImport(task.id, rows);
                await completeExcelTask(task.id);
                return {
                    code: 0,
                    data: {
                        status: 'COMPLETED',
                        progress: 100,
                        totalRows: rows.length,
                        processedRows: rows.length,
                    },
                    message: 'success',
                };
            }
            return {
                code: 0,
                data: {
                    status: 'COMPLETED',
                    progress: 100,
                    totalRows: rows.length,
                    processedRows: rows.length,
                },
                message: 'success',
            };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    // GET /api/excel/tasks - 查询任务列表
    app.get('/tasks', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zExcelTask) },
        },
    }, async (request, reply) => {
        const query = request.query;
        const userId = request.user?.id ?? 1;
        const tasks = await listExcelTasks(userId, query.module, query.status);
        return { code: 0, data: { list: tasks.map(toTaskView), total: tasks.length, page: 1, pageSize: 100 }, message: 'success' };
    });
    // GET /api/excel/tasks/:id - 查询任务详情
    app.get('/tasks/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zImportProgress) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const task = await getExcelTaskById(Number(id));
        if (!task) {
            reply.status(404);
            return { code: 10001, data: null, message: '任务不存在' };
        }
        return {
            code: 0,
            data: {
                status: task.status,
                progress: Math.round((task.processedRows / (task.totalRows || 1)) * 100),
                totalRows: task.totalRows,
                processedRows: task.processedRows,
            },
            message: 'success',
        };
    });
};
// ponytail: 简化 CSV 解析，实际应使用 ExcelJS
function parseCsvBuffer(buffer) {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0)
        return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() ?? '';
        });
        rows.push(row);
    }
    return rows;
}
//# sourceMappingURL=excel.js.map