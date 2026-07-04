import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

export const orgReorderRoutes: FastifyPluginAsync = async (app) => {
  app.put(
    '/reorder',
    async (request) => {
      const { items } = request.body as { items: { id: number; sortOrder: number }[] };
      await prisma.$transaction(
        items.map((item) =>
          prisma.department.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
        ),
      );
      return { code: 0, data: null, message: 'success' };
    },
  );
};
