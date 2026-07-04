import { z } from 'zod';
import { zShiftTemplateCreate, zShiftTemplateUpdate, zShiftTemplate, zRotationRuleCreate, zRotationRule, zScheduleCreate, zScheduleUpdate, zSchedule, zScheduleGenerateInput, zScheduleGenerateResult, zScheduleClearRange, zScheduleQuery, zScheduleConflict, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createShiftTemplate, findAllShiftTemplates, findShiftTemplateById, updateShiftTemplate, deleteShiftTemplate, } from '../services/shift-template.service.js';
import { createRotationRule, findAllRotationRules, findRotationRuleById, updateRotationRule, deleteRotationRule, } from '../services/rotation-rule.service.js';
import { createSchedule, findSchedulesByDateRange, updateSchedule, deleteSchedule, generateSchedule, clearScheduleRange, checkConflicts, } from '../services/schedule.service.js';
import { checkScheduleConstraints, checkBatchScheduleConstraints, } from '../services/schedule-constraints.service.js';
import { createScheduleTemplateFromHistory, applyScheduleTemplate, listScheduleTemplates, getScheduleTemplate, deleteScheduleTemplate, } from '../services/schedule-template.service.js';
export const scheduleRoutes = async (app) => {
    // 模块级权限：GET → schedule:read，其他 → schedule:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'schedule:read' : 'schedule:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    // ═══════════════════ 班次模板路由 ═══════════════════
    app.get('/shift-templates', {
        schema: {
            description: '获取所有班次模板',
            tags: ['排班'],
            response: {
                200: createResponseSchema(z.array(zShiftTemplate)),
            },
        },
    }, async () => {
        const data = await findAllShiftTemplates();
        return { code: 0, data, message: 'ok' };
    });
    app.post('/shift-templates', {
        schema: {
            description: '创建班次模板',
            tags: ['排班'],
            body: zodToSchema(zShiftTemplateCreate),
            response: {
                200: createResponseSchema(zShiftTemplate),
            },
        },
    }, async (request) => {
        const body = zShiftTemplateCreate.parse(request.body);
        const data = await createShiftTemplate(body);
        return { code: 0, data, message: 'ok' };
    });
    app.get('/shift-templates/:id', {
        schema: {
            description: '根据ID获取班次模板',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(zShiftTemplate.nullable()),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await findShiftTemplateById(id);
        return { code: 0, data, message: 'ok' };
    });
    app.put('/shift-templates/:id', {
        schema: {
            description: '更新班次模板',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zShiftTemplateUpdate),
            response: {
                200: createResponseSchema(zShiftTemplate),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const body = zShiftTemplateUpdate.parse(request.body);
        const data = await updateShiftTemplate(id, body);
        return { code: 0, data, message: 'ok' };
    });
    app.delete('/shift-templates/:id', {
        schema: {
            description: '删除班次模板',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(z.boolean()),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await deleteShiftTemplate(id);
        return { code: 0, data, message: 'ok' };
    });
    // ═══════════════════ 轮班规则路由 ═══════════════════
    app.get('/rotation-rules', {
        schema: {
            description: '获取所有轮班规则',
            tags: ['排班'],
            response: {
                200: createResponseSchema(z.array(zRotationRule)),
            },
        },
    }, async () => {
        const data = await findAllRotationRules();
        return { code: 0, data, message: 'ok' };
    });
    app.post('/rotation-rules', {
        schema: {
            description: '创建轮班规则',
            tags: ['排班'],
            body: zodToSchema(zRotationRuleCreate),
            response: {
                200: createResponseSchema(zRotationRule),
            },
        },
    }, async (request) => {
        const body = zRotationRuleCreate.parse(request.body);
        const data = await createRotationRule(body);
        return { code: 0, data, message: 'ok' };
    });
    app.get('/rotation-rules/:id', {
        schema: {
            description: '根据ID获取轮班规则',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(zRotationRule.nullable()),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await findRotationRuleById(id);
        return { code: 0, data, message: 'ok' };
    });
    app.put('/rotation-rules/:id', {
        schema: {
            description: '更新轮班规则',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zRotationRuleCreate),
            response: {
                200: createResponseSchema(zRotationRule),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const body = zRotationRuleCreate.parse(request.body);
        const data = await updateRotationRule(id, body);
        return { code: 0, data, message: 'ok' };
    });
    app.delete('/rotation-rules/:id', {
        schema: {
            description: '删除轮班规则',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(z.boolean()),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await deleteRotationRule(id);
        return { code: 0, data, message: 'ok' };
    });
    // ═══════════════════ 排班记录路由 ═══════════════════
    app.get('/schedules', {
        schema: {
            description: '查询排班记录',
            tags: ['排班'],
            querystring: zodToSchema(zScheduleQuery),
            response: {
                200: createResponseSchema(z.array(zSchedule)),
            },
        },
    }, async (request) => {
        const query = zScheduleQuery.parse(request.query);
        const data = await findSchedulesByDateRange({
            startDate: query.startDate,
            endDate: query.endDate,
            departmentId: query.departmentId,
            employeeId: query.employeeId,
        });
        return { code: 0, data, message: 'ok' };
    });
    app.post('/schedules', {
        schema: {
            description: '创建排班记录',
            tags: ['排班'],
            body: zodToSchema(zScheduleCreate),
            response: {
                200: createResponseSchema(zSchedule),
            },
        },
    }, async (request) => {
        const body = zScheduleCreate.parse(request.body);
        const data = await createSchedule(body);
        return { code: 0, data, message: 'ok' };
    });
    app.put('/schedules/:id', {
        schema: {
            description: '更新排班记录',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zScheduleUpdate),
            response: {
                200: createResponseSchema(zSchedule),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const body = zScheduleUpdate.parse(request.body);
        const data = await updateSchedule(id, body);
        return { code: 0, data, message: 'ok' };
    });
    app.delete('/schedules/:id', {
        schema: {
            description: '删除排班记录',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(z.boolean()),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await deleteSchedule(id);
        return { code: 0, data, message: 'ok' };
    });
    app.post('/schedules/generate', {
        schema: {
            description: '根据轮班规则生成排班',
            tags: ['排班'],
            body: zodToSchema(zScheduleGenerateInput),
            response: {
                200: createResponseSchema(zScheduleGenerateResult),
            },
        },
    }, async (request) => {
        const body = zScheduleGenerateInput.parse(request.body);
        const data = await generateSchedule(body);
        return { code: 0, data, message: 'ok' };
    });
    app.post('/schedules/clear-range', {
        schema: {
            description: '清除指定日期范围的排班',
            tags: ['排班'],
            body: zodToSchema(zScheduleClearRange),
            response: {
                200: createResponseSchema(z.number()),
            },
        },
    }, async (request) => {
        const body = zScheduleClearRange.parse(request.body);
        const data = await clearScheduleRange(body);
        return { code: 0, data, message: 'ok' };
    });
    app.get('/schedules/conflicts', {
        schema: {
            description: '检测冲突',
            tags: ['排班'],
            querystring: zodToSchema(z.object({ startDate: z.string(), endDate: z.string() })),
            response: {
                200: createResponseSchema(z.array(zScheduleConflict)),
            },
        },
    }, async (request) => {
        const query = request.query;
        const data = await checkConflicts({
            startDate: query.startDate,
            endDate: query.endDate,
        });
        return { code: 0, data, message: 'ok' };
    });
    // ═══════════════════ 约束检查路由 ═══════════════════
    const zConstraintViolation = z.object({
        type: z.enum(['HARD', 'SOFT']),
        code: z.string(),
        message: z.string(),
        employeeId: z.number(),
        date: z.string().optional(),
    });
    const zConstraintCheckBody = z.object({
        employeeId: z.number().int().positive(),
        shiftTemplateId: z.number().int().positive(),
        date: z.string(),
        config: z.custom().optional(),
    });
    app.post('/constraints/check', {
        schema: {
            description: '单条约束检查',
            tags: ['排班'],
            body: zodToSchema(zConstraintCheckBody),
            response: {
                200: createResponseSchema(z.array(zConstraintViolation)),
            },
        },
    }, async (request) => {
        const body = zConstraintCheckBody.parse(request.body);
        const data = await checkScheduleConstraints(body.employeeId, body.shiftTemplateId, new Date(body.date), body.config);
        return { code: 0, data, message: 'ok' };
    });
    const zBatchConstraintCheckBody = z.object({
        schedules: z.array(z.object({
            employeeId: z.number().int().positive(),
            shiftTemplateId: z.number().int().positive(),
            date: z.string(),
        })).min(1),
        config: z.custom().optional(),
    });
    app.post('/constraints/batch-check', {
        schema: {
            description: '批量约束检查',
            tags: ['排班'],
            body: zodToSchema(zBatchConstraintCheckBody),
            response: {
                200: createResponseSchema(z.record(z.array(zConstraintViolation))),
            },
        },
    }, async (request) => {
        const body = zBatchConstraintCheckBody.parse(request.body);
        const schedules = body.schedules.map((s) => ({
            ...s,
            date: new Date(s.date),
        }));
        const map = await checkBatchScheduleConstraints(schedules, body.config);
        const data = {};
        for (const [key, violations] of map) {
            data[key] = violations;
        }
        return { code: 0, data, message: 'ok' };
    });
    // ═══════════════════ 排班模板路由 ═══════════════════
    const zScheduleTemplateItem = z.object({
        id: z.number(),
        name: z.string(),
        departmentId: z.number().nullable(),
        description: z.string().nullable(),
        pattern: z.any(),
        sourceStartDate: z.coerce.date(),
        sourceEndDate: z.coerce.date(),
        totalDays: z.number(),
        createdFrom: z.string(),
        creatorId: z.number(),
        creatorName: z.string(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
    });
    const zCreateTemplateBody = z.object({
        name: z.string().min(1),
        departmentId: z.number().int().optional(),
        description: z.string().optional(),
        sourceStartDate: z.string(),
        sourceEndDate: z.string(),
        sourceEmployees: z.array(z.number().int().positive()).min(1),
        creatorId: z.number().int(),
        creatorName: z.string().min(1),
    });
    const zTemplateListQuery = z.object({
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().default(20),
        departmentId: z.coerce.number().int().optional(),
    });
    app.get('/templates', {
        schema: {
            description: '获取排班模板列表',
            tags: ['排班'],
            querystring: zodToSchema(zTemplateListQuery),
            response: {
                200: createPaginatedResponseSchema(zScheduleTemplateItem),
            },
        },
    }, async (request) => {
        const query = zTemplateListQuery.parse(request.query);
        const data = await listScheduleTemplates(query.page, query.pageSize, query.departmentId);
        return { code: 0, data: { list: data.items, total: data.total, page: query.page, pageSize: query.pageSize }, message: 'ok' };
    });
    app.post('/templates', {
        schema: {
            description: '从历史创建排班模板',
            tags: ['排班'],
            body: zodToSchema(zCreateTemplateBody),
            response: {
                200: createResponseSchema(zScheduleTemplateItem),
            },
        },
    }, async (request) => {
        const body = zCreateTemplateBody.parse(request.body);
        const data = await createScheduleTemplateFromHistory({
            ...body,
            sourceStartDate: new Date(body.sourceStartDate),
            sourceEndDate: new Date(body.sourceEndDate),
        });
        return { code: 0, data, message: 'ok' };
    });
    app.get('/templates/:id', {
        schema: {
            description: '获取排班模板详情',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(zScheduleTemplateItem),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await getScheduleTemplate(id);
        return { code: 0, data, message: 'ok' };
    });
    app.delete('/templates/:id', {
        schema: {
            description: '删除排班模板',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            response: {
                200: createResponseSchema(zScheduleTemplateItem),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const data = await deleteScheduleTemplate(id);
        return { code: 0, data, message: 'ok' };
    });
    const zApplyTemplateBody = z.object({
        employeeIds: z.array(z.number().int().positive()).min(1),
        startDate: z.string(),
    });
    const zApplyResult = z.object({
        created: z.number(),
        skipped: z.number(),
        conflicts: z.array(z.object({
            employeeId: z.number(),
            date: z.string(),
            reason: z.string(),
        })),
    });
    app.post('/templates/:id/apply', {
        schema: {
            description: '应用排班模板',
            tags: ['排班'],
            params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
            body: zodToSchema(zApplyTemplateBody),
            response: {
                200: createResponseSchema(zApplyResult),
            },
        },
    }, async (request) => {
        const { id } = request.params;
        const body = zApplyTemplateBody.parse(request.body);
        const data = await applyScheduleTemplate(id, body.employeeIds, new Date(body.startDate));
        return { code: 0, data, message: 'ok' };
    });
};
//# sourceMappingURL=schedule.js.map