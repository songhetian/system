import { z } from 'zod';
import { zPaginationParams } from '@shop/shared';
import { zodToSchema } from '../utils/zod-to-schema.js';
import { prisma } from '../lib/prisma.js';
export const auditRoutes = async (app) => {
    app.get('/', {
        schema: {
            querystring: zodToSchema(zPaginationParams.extend({
                entityType: z.string().optional(),
                action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
                userId: z.coerce.number().int().optional(),
            })),
        },
    }, async (request) => {
        const query = request.query;
        const page = Number(query.page) || 1;
        const pageSize = Number(query.pageSize) || 10;
        const { entityType, action, userId } = query;
        const where = {};
        if (entityType)
            where.entityType = entityType;
        if (action)
            where.action = action;
        if (userId)
            where.userId = userId;
        const [list, total] = await Promise.all([
            prisma.operationLog.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: [{ createdAt: 'desc' }],
            }),
            prisma.operationLog.count({ where }),
        ]);
        return { code: 0, data: { list, total, page, pageSize }, message: 'success' };
    });
};
//# sourceMappingURL=audit.js.map