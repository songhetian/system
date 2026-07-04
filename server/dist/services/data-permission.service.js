import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
export async function createDataPermission(data) {
    if (!data.userId && !data.roleId) {
        throw Errors.validation('必须指定用户或角色');
    }
    return prisma.dataPermission.create({
        data: {
            userId: data.userId,
            roleId: data.roleId,
            resourceType: data.resourceType,
            scope: data.scope,
            departmentId: data.scope === 'DEPARTMENT' || data.scope === 'DEPARTMENT_AND_CHILDREN' ? data.departmentId : null,
        },
    });
}
export async function listDataPermissions(query) {
    const { page = 1, pageSize = 10, userId, roleId, resourceType } = query;
    const where = {};
    if (userId)
        where.userId = userId;
    if (roleId)
        where.roleId = roleId;
    if (resourceType)
        where.resourceType = resourceType;
    const [total, items] = await Promise.all([
        prisma.dataPermission.count({ where }),
        prisma.dataPermission.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    return { total, items };
}
export async function getDataPermission(id) {
    const perm = await prisma.dataPermission.findUnique({ where: { id } });
    if (!perm)
        throw Errors.notFound('数据权限配置不存在');
    return perm;
}
export async function updateDataPermission(id, data) {
    await getDataPermission(id);
    return prisma.dataPermission.update({
        where: { id },
        data: {
            resourceType: data.resourceType,
            scope: data.scope,
            departmentId: data.scope === 'DEPARTMENT' || data.scope === 'DEPARTMENT_AND_CHILDREN' ? data.departmentId : null,
        },
    });
}
export async function deleteDataPermission(id) {
    await getDataPermission(id);
    return prisma.dataPermission.delete({ where: { id } });
}
export async function getUserDataScope(userId, resourceType) {
    const userPerm = await prisma.dataPermission.findFirst({
        where: { userId, resourceType },
    });
    if (userPerm)
        return userPerm.scope;
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        select: { roleId: true },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0)
        return 'OWN';
    const rolePerm = await prisma.dataPermission.findFirst({
        where: { roleId: { in: roleIds }, resourceType },
        orderBy: { createdAt: 'desc' },
    });
    return rolePerm?.scope || 'OWN';
}
export async function getUserDepartmentIds(userId, scope) {
    if (scope === 'ALL')
        return [];
    if (scope === 'OWN')
        return [];
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: { include: { employeePositions: { include: { position: true } } } } },
    });
    if (!user?.employee)
        return [];
    const currentPosition = user.employee.employeePositions.find((ep) => ep.endDate === null);
    if (!currentPosition)
        return [];
    const departmentId = currentPosition.position.departmentId;
    if (scope === 'DEPARTMENT') {
        return [departmentId];
    }
    if (scope === 'DEPARTMENT_AND_CHILDREN') {
        const dept = await prisma.department.findUnique({
            where: { id: departmentId },
            include: { children: true },
        });
        if (!dept)
            return [departmentId];
        const childIds = dept.children.map((c) => c.id);
        return [departmentId, ...childIds];
    }
    return [];
}
//# sourceMappingURL=data-permission.service.js.map