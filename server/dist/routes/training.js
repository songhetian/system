import { z } from 'zod';
import { zTrainingCourseCreate, zTrainingCourseUpdate, zTrainingCourse, zTrainingCourseQuery, zTrainingEnrollment, zTrainingCompletion, zTrainingRecord, } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { createTrainingCourse, getTrainingCourseById, listTrainingCourses, updateTrainingCourse, deleteTrainingCourse, enrollInCourse, completeTraining, getTrainingRecords, } from '../services/training.service.js';
const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
function toCourseView(course) {
    return {
        ...course,
        startDate: course.startDate?.toISOString().split('T')[0] ?? null,
        endDate: course.endDate?.toISOString().split('T')[0] ?? null,
        enrolledCount: course.enrollments?.length ?? 0,
        createdAt: course.createdAt?.toISOString() ?? null,
        updatedAt: course.updatedAt?.toISOString() ?? null,
    };
}
export const trainingRoutes = async (app) => {
    // 模块级权限：GET → training:read，其他 → training:write
    app.addHook('onRequest', async (request, reply) => {
        const perm = request.method === 'GET' ? 'training:read' : 'training:write';
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(perm)) {
            reply.status(403).send({ code: 20001, data: null, message: '无权限' });
        }
    });
    app.post('/courses', {
        schema: {
            response: { 200: createResponseSchema(zTrainingCourse) },
        },
    }, async (request, reply) => {
        try {
            const body = zTrainingCourseCreate.parse(request.body);
            const course = await createTrainingCourse(body);
            return { code: 0, data: toCourseView(course), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/courses', {
        schema: {
            response: { 200: createPaginatedResponseSchema(zTrainingCourse) },
        },
    }, async (request, reply) => {
        const query = zTrainingCourseQuery.parse(request.query);
        const result = await listTrainingCourses(query);
        return {
            code: 0,
            data: { ...result, list: result.list.map(toCourseView) },
            message: 'success',
        };
    });
    app.get('/courses/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zTrainingCourse) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const course = await getTrainingCourseById(Number(id));
        return { code: 0, data: course ? toCourseView(course) : null, message: 'success' };
    });
    app.put('/courses/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zTrainingCourse) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zTrainingCourseUpdate.parse(request.body);
            const course = await updateTrainingCourse(Number(id), body);
            return { code: 0, data: toCourseView(course), message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.delete('/courses/:id', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.null()) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        await deleteTrainingCourse(Number(id));
        return { code: 0, data: null, message: 'success' };
    });
    app.post('/courses/:id/enroll', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(z.object({ count: z.number() })) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zTrainingEnrollment.parse(request.body);
            const result = await enrollInCourse(Number(id), body);
            return { code: 0, data: result, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.post('/courses/:id/complete', {
        schema: {
            params: idParamsSchema,
            response: { 200: createResponseSchema(zTrainingRecord) },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const body = zTrainingCompletion.parse(request.body);
            const record = await completeTraining({ ...body, courseId: Number(id) });
            const result = {
                id: record.id,
                employeeId: record.employeeId,
                employeeName: record.employee?.name ?? '',
                courseName: record.course?.name ?? '',
                type: record.course?.type,
                startDate: record.course?.startDate?.toISOString().split('T')[0] ?? null,
                endDate: record.course?.endDate?.toISOString().split('T')[0] ?? null,
                score: record.score != null ? Number(record.score) : null,
                completedAt: record.completedAt?.toISOString() ?? null,
            };
            return { code: 0, data: result, message: 'success' };
        }
        catch (err) {
            reply.status(400);
            return { code: 10000, data: null, message: err.message };
        }
    });
    app.get('/records', {
        schema: {
            response: { 200: createResponseSchema(z.array(zTrainingRecord)) },
        },
    }, async (request, reply) => {
        const query = request.query;
        const records = await getTrainingRecords(query.employeeId ? Number(query.employeeId) : undefined);
        return {
            code: 0,
            data: records.map((r) => ({
                id: r.id,
                employeeId: r.employeeId,
                employeeName: r.employee?.name ?? '',
                courseName: r.course?.name ?? '',
                type: r.course?.type,
                startDate: r.course?.startDate?.toISOString().split('T')[0] ?? null,
                endDate: r.course?.endDate?.toISOString().split('T')[0] ?? null,
                score: r.score != null ? Number(r.score) : null,
                completedAt: r.completedAt?.toISOString() ?? null,
            })),
            message: 'success',
        };
    });
};
//# sourceMappingURL=training.js.map