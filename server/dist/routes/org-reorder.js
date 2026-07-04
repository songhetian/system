import { prisma } from '../lib/prisma.js';
export const orgReorderRoutes = async (app) => {
    app.put('/reorder', async (request) => {
        const { items } = request.body;
        await prisma.$transaction(items.map((item) => prisma.department.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
        return { code: 0, data: null, message: 'success' };
    });
};
//# sourceMappingURL=org-reorder.js.map