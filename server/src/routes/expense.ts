import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  zExpenseClaimCreate,
  zExpenseClaimUpdate,
  zExpenseClaim,
  zExpenseClaimQuery,
} from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import {
  createExpenseClaim,
  getExpenseClaimById,
  listExpenseClaims,
  updateExpenseClaim,
  submitExpenseClaim,
  approveExpenseClaim,
  rejectExpenseClaim,
} from '../services/expense.service.js';

const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));

function toClaimView(claim: any) {
  return {
    ...claim,
    amount: Number(claim.amount),
    createdAt: claim.createdAt?.toISOString() ?? null,
    updatedAt: claim.updatedAt?.toISOString() ?? null,
  };
}

export const expenseRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → expense:read，其他 → expense:write
  app.addHook('onRequest', async (request, reply) => {
    const perm = request.method === 'GET' ? 'expense:read' : 'expense:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  app.post(
    '/claims',
    {
      schema: {
        response: { 200: createResponseSchema(zExpenseClaim) },
      },
    },
    async (request, reply) => {
      try {
        const body = zExpenseClaimCreate.parse(request.body);
        const employeeId = (request as any).employeeId ?? request.user?.employeeId ?? 1;
        const claim = await createExpenseClaim(body, employeeId);
        return { code: 0, data: toClaimView(claim), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.get(
    '/claims',
    {
      schema: {
        response: { 200: createPaginatedResponseSchema(zExpenseClaim) },
      },
    },
    async (request, reply) => {
      const query = zExpenseClaimQuery.parse(request.query);
      const result = await listExpenseClaims(query);
      return {
        code: 0,
        data: { ...result, list: result.list.map(toClaimView) },
        message: 'success',
      };
    },
  );

  app.get(
    '/claims/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zExpenseClaim.nullable()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const claim = await getExpenseClaimById(Number(id));
      return { code: 0, data: claim ? toClaimView(claim) : null, message: 'success' };
    },
  );

  app.put(
    '/claims/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zExpenseClaim) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      try {
        const body = zExpenseClaimUpdate.parse(request.body);
        const claim = await updateExpenseClaim(Number(id), body);
        return { code: 0, data: toClaimView(claim), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.post(
    '/claims/:id/submit',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zExpenseClaim) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      try {
        const claim = await submitExpenseClaim(Number(id));
        return { code: 0, data: toClaimView(claim), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.post(
    '/claims/:id/approve',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zExpenseClaim) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      try {
        const claim = await approveExpenseClaim(Number(id));
        return { code: 0, data: toClaimView(claim), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.post(
    '/claims/:id/reject',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zExpenseClaim) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      try {
        const claim = await rejectExpenseClaim(Number(id));
        return { code: 0, data: toClaimView(claim), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );
};
