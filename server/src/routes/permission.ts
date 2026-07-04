import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { zPermission, zPermissionQuery } from '@shop/shared';
import { createResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { listPermissions } from '../services/role.service.js';

export const permissionRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → permission:read，其他 → permission:write
  app.addHook('onRequest', async (request, reply) => {
    const perm = request.method === 'GET' ? 'permission:read' : 'permission:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  app.get(
    '/',
    {
      schema: {
        querystring: zodToSchema(zPermissionQuery),
        response: { 200: createResponseSchema(z.array(zPermission)) },
      },
    },
    async (request, reply) => {
      const query = zPermissionQuery.parse(request.query);
      const permissions = await listPermissions(query);
      return { code: 0, data: permissions, message: 'success' };
    },
  );
};
