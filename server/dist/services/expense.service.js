import { prisma } from '../lib/prisma.js';
export async function createExpenseClaim(data, employeeId) {
    return prisma.expenseClaim.create({
        data: {
            employeeId,
            title: data.title,
            expenseType: data.expenseType,
            amount: data.amount,
            description: data.description,
            attachments: data.attachments,
        },
    });
}
export async function getExpenseClaimById(id) {
    return prisma.expenseClaim.findUnique({ where: { id } });
}
export async function listExpenseClaims(query) {
    const { page = 1, pageSize = 10, status, employeeId, dateFrom, dateTo } = query;
    const where = {};
    if (status)
        where.status = status;
    if (employeeId)
        where.employeeId = employeeId;
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom)
            where.createdAt.gte = new Date(dateFrom);
        if (dateTo)
            where.createdAt.lte = new Date(dateTo);
    }
    const [list, total] = await Promise.all([
        prisma.expenseClaim.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
        }),
        prisma.expenseClaim.count({ where }),
    ]);
    return { list, total, page, pageSize };
}
export async function updateExpenseClaim(id, data) {
    return prisma.expenseClaim.update({
        where: { id },
        data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.expenseType !== undefined && { expenseType: data.expenseType }),
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.attachments !== undefined && { attachments: data.attachments }),
        },
    });
}
export async function submitExpenseClaim(id) {
    return prisma.expenseClaim.update({
        where: { id },
        data: { status: 'PENDING' },
    });
}
export async function approveExpenseClaim(id) {
    return prisma.expenseClaim.update({
        where: { id },
        data: { status: 'APPROVED' },
    });
}
export async function rejectExpenseClaim(id) {
    return prisma.expenseClaim.update({
        where: { id },
        data: { status: 'REJECTED' },
    });
}
//# sourceMappingURL=expense.service.js.map