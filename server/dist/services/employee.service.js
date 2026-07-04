import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
export async function createEmployee(data) {
    const dept = await prisma.department.findUnique({
        where: { id: data.departmentId, deletedAt: null },
    });
    if (!dept)
        throw Errors.notFound('部门不存在');
    const positions = await prisma.position.findMany({
        where: { id: { in: data.positionIds }, deletedAt: null },
        include: { department: true },
    });
    if (positions.length !== data.positionIds.length) {
        throw Errors.business('岗位不存在');
    }
    // ponytail: 校验岗位属于所选部门，防止跨部门分配
    const wrongDept = positions.find((p) => p.departmentId !== data.departmentId);
    if (wrongDept)
        throw Errors.business('岗位不属于所选部门');
    return prisma.employee.create({
        data: {
            name: data.name,
            employeeNo: data.employeeNo,
            phone: data.phone,
            email: data.email,
            idCard: data.idCard,
            hireDate: new Date(data.hireDate),
            employeePositions: {
                create: data.positionIds.map((positionId) => ({
                    positionId,
                    startDate: new Date(),
                })),
            },
        },
        include: { employeePositions: true },
    });
}
export async function getEmployeeById(id) {
    return prisma.employee.findUnique({
        where: { id, deletedAt: null },
        include: { employeePositions: { include: { position: true } } },
    });
}
export async function listEmployees(params) {
    const { page, pageSize, departmentId, positionId, status, keyword } = params;
    const where = { deletedAt: null };
    if (status)
        where.status = status;
    if (keyword) {
        where.OR = [
            { name: { contains: keyword } },
            { employeeNo: { contains: keyword } },
        ];
    }
    if (positionId || departmentId) {
        const posFilter = {};
        if (positionId)
            posFilter.positionId = positionId;
        if (departmentId)
            posFilter.position = { departmentId };
        where.employeePositions = { some: posFilter };
    }
    const [list, total] = await Promise.all([
        prisma.employee.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ id: 'desc' }],
            include: { employeePositions: { include: { position: true } } },
        }),
        prisma.employee.count({ where }),
    ]);
    // 脱敏：列表中 idCard 和 phone 显示为 ****
    const maskedList = list.map((emp) => ({
        ...emp,
        idCard: '****',
        phone: '****',
    }));
    return { list: maskedList, total, page, pageSize };
}
export async function updateEmployee(id, data) {
    if (data.positionIds) {
        const positions = await prisma.position.findMany({
            where: { id: { in: data.positionIds }, deletedAt: null },
        });
        if (positions.length !== data.positionIds.length) {
            throw Errors.business('岗位不存在');
        }
    }
    return prisma.$transaction(async (tx) => {
        if (data.positionIds) {
            await tx.employeePosition.deleteMany({ where: { employeeId: id } });
            await tx.employeePosition.createMany({
                data: data.positionIds.map((positionId) => ({
                    employeeId: id,
                    positionId,
                    startDate: new Date(),
                })),
            });
        }
        return tx.employee.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.employeeNo !== undefined && { employeeNo: data.employeeNo }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.idCard !== undefined && { idCard: data.idCard }),
                ...(data.hireDate !== undefined && { hireDate: new Date(data.hireDate) }),
            },
        });
    });
}
export async function deleteEmployee(id) {
    await prisma.employee.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
export async function regularizeEmployee(id, regularizeDate) {
    return prisma.employee.update({
        where: { id, deletedAt: null },
        data: {
            status: 'ACTIVE',
            regularizeDate: new Date(regularizeDate),
        },
    });
}
export async function resignEmployee(id, resignDate, reason) {
    const emp = await prisma.employee.findUnique({ where: { id, deletedAt: null } });
    if (!emp)
        throw Errors.notFound('员工不存在');
    return prisma.employee.update({
        where: { id },
        data: {
            status: 'RESIGNED',
            resignDate: new Date(resignDate),
            remark: reason || null,
        },
    });
}
//# sourceMappingURL=employee.service.js.map