import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { zUserRoleAssign, zUserListQuery } from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { assignUserRoles, listUsers } from '../services/role.service.js';
import { prisma } from '../lib/prisma.js';

const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));

function toUserView(user: any) {
  return {
    id: user.id,
    username: user.username,
    employeeId: user.employeeId,
    employeeName: user.employee?.name ?? null,
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };
}

export const userRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → user:read，其他 → user:write
  app.addHook('onRequest', async (request, reply) => {
    const perm = request.method === 'GET' ? 'user:read' : 'user:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  app.get(
    '/',
    {
      schema: {
        querystring: zodToSchema(zUserListQuery),
        response: { 200: createPaginatedResponseSchema(z.object({
          id: z.number(),
          username: z.string(),
          employeeId: z.number().nullable(),
          employeeName: z.string().nullable(),
          createdAt: z.string().nullable(),
          updatedAt: z.string().nullable(),
        })) },
      },
    },
    async (request, reply) => {
      const query = zUserListQuery.parse(request.query);
      const result = await listUsers(query.page, query.pageSize, query.keyword);
      return {
        code: 0,
        data: { ...result, list: result.list.map(toUserView) },
        message: 'success',
      };
    },
  );

  // 创建用户
  app.post(
    '/',
    {
      schema: {
        body: zodToSchema(z.object({
          username: z.string().min(1).max(50),
          password: z.string().min(6),
          email: z.string().email().nullable().optional(),
        })),
      },
    },
    async (request, reply) => {
      const { username, password, email } = request.body as any;
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) return reply.status(400).send({ code: 10000, data: null, message: '用户名已存在' });

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, password: hashed, email: email || null },
      });
      return { code: 0, data: { id: user.id, username: user.username }, message: 'success' };
    },
  );

  app.put(
    '/:id/roles',
    {
      schema: {
        params: idParamsSchema,
        body: zodToSchema(zUserRoleAssign),
        response: { 200: createResponseSchema(z.number()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zUserRoleAssign.parse(request.body);
      try {
        const count = await assignUserRoles(Number(id), body.roleIds);
        return { code: 0, data: count, message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );
};
