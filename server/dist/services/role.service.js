import { prisma } from '../lib/prisma.js';
import { deleteCachePattern, deleteCache } from '../lib/redis.js';
import { Errors } from '../lib/errors.js';
async function invalidateAllUserPermissions() {
    await deleteCachePattern('user:perms:*');
}
export async function createRole(data) {
    const result = await prisma.role.create({
        data: {
            name: data.name,
            code: data.code,
            description: data.description,
        },
    });
    await invalidateAllUserPermissions();
    return result;
}
export async function getRoleById(id) {
    return prisma.role.findUnique({
        where: { id, deletedAt: null },
    });
}
export async function listRoles(query) {
    const { page = 1, pageSize = 10, keyword } = query;
    const where = { deletedAt: null };
    if (keyword) {
        where.name = { contains: keyword };
    }
    const [list, total] = await Promise.all([
        prisma.role.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ id: 'asc' }],
        }),
        prisma.role.count({ where }),
    ]);
    return { list, total, page, pageSize };
}
export async function listUsers(page = 1, pageSize = 100, keyword) {
    const where = { deletedAt: null };
    if (keyword) {
        where.username = { contains: keyword };
    }
    const [list, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ id: 'asc' }],
            include: { employee: { select: { id: true, name: true } } },
        }),
        prisma.user.count({ where }),
    ]);
    return { list, total, page, pageSize };
}
export async function updateRole(id, data) {
    const result = await prisma.role.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.code !== undefined && { code: data.code }),
            ...(data.description !== undefined && { description: data.description }),
        },
    });
    await invalidateAllUserPermissions();
    return result;
}
export async function deleteRole(id) {
    await prisma.role.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    await invalidateAllUserPermissions();
}
export async function assignRolePermissions(roleId, permissionIds) {
    const role = await prisma.role.findUnique({
        where: { id: roleId, deletedAt: null },
    });
    if (!role)
        throw Errors.notFound('角色不存在');
    if (permissionIds.length > 0) {
        const found = await prisma.permission.findMany({
            where: { id: { in: permissionIds } },
            select: { id: true },
        });
        if (found.length !== permissionIds.length) {
            throw Errors.business('部分权限不存在');
        }
    }
    // ponytail: 覆盖式分配 — 事务内先清空再重建
    await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId } }),
        prisma.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
            skipDuplicates: true,
        }),
    ]);
    await invalidateAllUserPermissions();
    return permissionIds.length;
}
export async function getRolePermissions(roleId) {
    const links = await prisma.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
        orderBy: { permissionId: 'asc' },
    });
    return links.map((l) => l.permission);
}
// ─── 权限查询 ─────────────────────────────────────────────
export async function listPermissions(query) {
    const where = {};
    if (query.group) {
        where.group = query.group;
    }
    return prisma.permission.findMany({
        where,
        orderBy: [{ group: 'asc' }, { id: 'asc' }],
    });
}
// ─── 用户-角色分配 ─────────────────────────────────────────
export async function assignUserRoles(userId, roleIds) {
    const user = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
    });
    if (!user)
        throw Errors.notFound('用户不存在');
    if (roleIds.length > 0) {
        const found = await prisma.role.findMany({
            where: { id: { in: roleIds }, deletedAt: null },
            select: { id: true },
        });
        if (found.length !== roleIds.length) {
            throw Errors.business('部分角色不存在');
        }
    }
    // ponytail: 覆盖式分配 — 事务内先清空再重建
    await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId } }),
        prisma.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId, roleId })),
            skipDuplicates: true,
        }),
    ]);
    await deleteCache(`user:perms:${userId}`);
    return roleIds.length;
}
//# sourceMappingURL=role.service.js.map