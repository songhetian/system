import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  zAttendanceRecordCreate,
  zAttendanceRecord,
  zAttendanceRecordQuery,
  zAttendanceSummaryGenerate,
  zAttendanceSummary,
  zAttendanceSummaryQuery,
} from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import {
  clock,
  findByFilter as findRecordsByFilter,
  findById as findRecordById,
} from '../services/attendance-record.service.js';
import {
  generate,
  findByFilter as findSummariesByFilter,
  findById as findSummaryById,
  lock,
  unlock,
} from '../services/attendance-summary.service.js';

export const attendanceRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → attendance:read，其他 → attendance:write
  app.addHook('onRequest', async (request, reply) => {
    const perm = request.method === 'GET' ? 'attendance:read' : 'attendance:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  app.get(
    '/attendance-records',
    {
      schema: {
        description: '查询打卡记录列表',
        tags: ['考勤'],
        querystring: zodToSchema(zAttendanceRecordQuery),
        response: {
          200: createPaginatedResponseSchema(zAttendanceRecord),
        },
      },
    },
    async (request, reply) => {
      const params = zAttendanceRecordQuery.parse(request.query);
      const result = await findRecordsByFilter(params);

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );

  app.post(
    '/attendance-records/clock',
    {
      schema: {
        description: '打卡',
        tags: ['考勤'],
        body: zodToSchema(zAttendanceRecordCreate),
        response: {
          200: createResponseSchema(zAttendanceRecord),
        },
      },
    },
    async (request, reply) => {
      const body = zAttendanceRecordCreate.parse(request.body);
      const result = await clock({
        employeeId: body.employeeId,
        type: body.type,
        timestamp: new Date(body.timestamp),
      });

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );

  app.get(
    '/attendance-records/:id',
    {
      schema: {
        description: '根据ID获取打卡记录',
        tags: ['考勤'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zAttendanceRecord.nullable()),
        },
      },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
      const result = await findRecordById(id);

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );

  app.get(
    '/attendance-summaries',
    {
      schema: {
        description: '查询考勤台账列表',
        tags: ['考勤'],
        querystring: zodToSchema(zAttendanceSummaryQuery),
        response: {
          200: createPaginatedResponseSchema(zAttendanceSummary),
        },
      },
    },
    async (request, reply) => {
      const params = zAttendanceSummaryQuery.parse(request.query);
      const result = await findSummariesByFilter(params);

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );

  app.post(
    '/attendance-summaries/generate',
    {
      schema: {
        description: '生成月度考勤台账',
        tags: ['考勤'],
        body: zodToSchema(zAttendanceSummaryGenerate),
        response: {
          200: createResponseSchema(z.object({ count: z.number() })),
        },
      },
    },
    async (request, reply) => {
      const body = zAttendanceSummaryGenerate.parse(request.body);
      const count = await generate(body);

      return {
        code: 0,
        data: { count },
        message: 'ok',
      };
    },
  );

  app.get(
    '/attendance-summaries/:id',
    {
      schema: {
        description: '根据ID获取考勤台账',
        tags: ['考勤'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zAttendanceSummary.nullable()),
        },
      },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
      const result = await findSummaryById(id);

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );

  app.post(
    '/attendance-summaries/:id/lock',
    {
      schema: {
        description: '锁定考勤台账',
        tags: ['考勤'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zAttendanceSummary),
        },
      },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
      const result = await lock(id);

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );

  app.post(
    '/attendance-summaries/:id/unlock',
    {
      schema: {
        description: '解锁考勤台账',
        tags: ['考勤'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zAttendanceSummary),
        },
      },
    },
    async (request, reply) => {
      const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(request.params);
      const result = await unlock(id);

      return {
        code: 0,
        data: result,
        message: 'ok',
      };
    },
  );
};