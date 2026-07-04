import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  zLeaveQuotaInit,
  zLeaveQuota,
  zLeaveQuotaQuery,
  zLeaveRequestCreate,
  zLeaveRequestUpdate,
  zLeaveRequestListItem,
  zLeaveRequestQuery,
  zLeaveApproval,
  zLeaveRejection,
} from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { buildRowAccessFilter } from '../utils/row-access.js';
import {
  initLeaveQuota,
  findLeaveQuotaByFilter,
  findLeaveQuotaById,
  updateLeaveQuota,
  LeaveQuotaError,
} from '../services/leave-quota.service.js';
import {
  createLeaveRequest,
  findLeaveRequestByFilter,
  findLeaveRequestById,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  LeaveRequestError,
} from '../services/leave-request.service.js';

export const leaveRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → leave:read，其他 → leave:write
  app.addHook('onRequest', async (request, reply) => {
    const perm = request.method === 'GET' ? 'leave:read' : 'leave:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  app.post(
    '/leave-quotas/init',
    {
      schema: {
        description: '初始化年度假期额度',
        tags: ['假期'],
        body: zodToSchema(zLeaveQuotaInit),
        response: {
          200: createResponseSchema(z.object({ count: z.number() })),
        },
      },
    },
    async (request, reply) => {
      const body = zLeaveQuotaInit.parse(request.body);
      try {
        const result = await initLeaveQuota(body.year);
        return {
          code: 0,
          data: { count: result.count },
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveQuotaError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.get(
    '/leave-quotas',
    {
      schema: {
        description: '查询假期额度列表',
        tags: ['假期'],
        querystring: zodToSchema(zLeaveQuotaQuery),
        response: {
          200: createPaginatedResponseSchema(zLeaveQuota),
        },
      },
    },
    async (request, reply) => {
      const params = zLeaveQuotaQuery.parse(request.query);
      try {
        const result = await findLeaveQuotaByFilter(params);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveQuotaError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.get(
    '/leave-quotas/:id',
    {
      schema: {
        description: '根据 ID 获取假期额度',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zLeaveQuota),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      try {
        const result = await findLeaveQuotaById(id);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveQuotaError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.put(
    '/leave-quotas/:id',
    {
      schema: {
        description: '更新假期额度',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zLeaveQuota.omit({ id: true, employeeId: true, employeeName: true, year: true }).partial()),
        response: {
          200: createResponseSchema(zLeaveQuota),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const body = request.body as any;
      try {
        const result = await updateLeaveQuota(id, body);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveQuotaError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.get(
    '/leave-requests',
    {
      schema: {
        description: '查询请假申请列表',
        tags: ['假期'],
        querystring: zodToSchema(zLeaveRequestQuery),
        response: {
          200: createPaginatedResponseSchema(zLeaveRequestListItem),
        },
      },
    },
    async (request, reply) => {
      const params = zLeaveRequestQuery.parse(request.query);
      try {
        const rowFilter = await buildRowAccessFilter(
          {
            userId: request.user.id,
            employeeId: request.employeeId,
            permissions: request.permissions,
            dataScopes: request.dataScopes || {},
          },
          'leave',
        );
        const result = await findLeaveRequestByFilter(params, rowFilter);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post(
    '/leave-requests',
    {
      schema: {
        description: '创建请假申请',
        tags: ['假期'],
        body: zodToSchema(zLeaveRequestCreate),
        response: {
          200: createResponseSchema(zLeaveRequestListItem),
        },
      },
    },
    async (request, reply) => {
      const body = zLeaveRequestCreate.parse(request.body);
      try {
        const result = await createLeaveRequest(body);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError || err instanceof LeaveQuotaError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.get(
    '/leave-requests/:id',
    {
      schema: {
        description: '根据 ID 获取请假申请',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zLeaveRequestListItem.extend({ approvalChain: z.any().nullable() })),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      try {
        const result = await findLeaveRequestById(id);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.put(
    '/leave-requests/:id',
    {
      schema: {
        description: '更新请假申请',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zLeaveRequestUpdate),
        response: {
          200: createResponseSchema(zLeaveRequestListItem),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const body = zLeaveRequestUpdate.parse(request.body);
      try {
        const result = await updateLeaveRequest(id, body);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post(
    '/leave-requests/:id/approve',
    {
      schema: {
        description: '审批通过',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zLeaveApproval),
        response: {
          200: createResponseSchema(zLeaveRequestListItem),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const body = zLeaveApproval.parse(request.body);
      try {
        const result = await approveLeaveRequest(id, body);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError || err instanceof LeaveQuotaError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post(
    '/leave-requests/:id/reject',
    {
      schema: {
        description: '拒绝申请',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zLeaveRejection),
        response: {
          200: createResponseSchema(zLeaveRequestListItem),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const body = zLeaveRejection.parse(request.body);
      try {
        const result = await rejectLeaveRequest(id, body);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post(
    '/leave-requests/:id/cancel',
    {
      schema: {
        description: '取消申请',
        tags: ['假期'],
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: {
          200: createResponseSchema(zLeaveRequestListItem),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      try {
        const result = await cancelLeaveRequest(id);
        return {
          code: 0,
          data: result,
          message: 'ok',
        };
      } catch (err) {
        if (err instanceof LeaveRequestError) {
          return reply.status(err.statusCode).send({
            code: err.code,
            data: null,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );
};