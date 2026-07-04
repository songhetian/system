import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('Role Routes - 角色', () => {
    let app;
    const createdRoleIds = [];
    const createdPermissionIds = [];
    const createdUserIds = [];
    // ponytail: zRoleCreate.code 正则 ^[a-z_]+$ 不允许数字，用纯字母随机串
    const uniqueCode = (prefix = 'r') => `${prefix}_${Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')}`;
    const createPermission = async (group = '测试组') => {
        const p = await prisma.permission.create({
            data: {
                code: uniqueCode('perm'),
                name: `权限_${Date.now()}_${Math.random()}`,
                group,
            },
        });
        createdPermissionIds.push(p.id);
        return p;
    };
    const createUser = async () => {
        const u = await prisma.user.create({
            data: {
                username: `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                passwordHash: 'dummy',
            },
        });
        createdUserIds.push(u.id);
        return u;
    };
    afterEach(async () => {
        for (const id of createdUserIds) {
            try {
                await prisma.userRole.deleteMany({ where: { userId: id } });
            }
            catch { }
            try {
                await prisma.user.delete({ where: { id } });
            }
            catch { }
        }
        createdUserIds.length = 0;
        for (const id of createdRoleIds) {
            try {
                await prisma.rolePermission.deleteMany({ where: { roleId: id } });
            }
            catch { }
            try {
                await prisma.role.update({ where: { id }, data: { deletedAt: new Date() } });
            }
            catch { }
            try {
                await prisma.role.delete({ where: { id } });
            }
            catch { }
        }
        createdRoleIds.length = 0;
        for (const id of createdPermissionIds) {
            try {
                await prisma.permission.delete({ where: { id } });
            }
            catch { }
        }
        createdPermissionIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    // ─── Slice 1: 创建角色 ─────────────────────────────────────
    it('POST /api/roles - 创建角色', async () => {
        app = await buildTestApp();
        const code = uniqueCode();
        const response = await app.inject({
            method: 'POST',
            url: '/api/roles',
            payload: {
                name: '测试角色',
                code,
                description: '用于单元测试',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBeTypeOf('number');
        expect(body.data.name).toBe('测试角色');
        expect(body.data.code).toBe(code);
        expect(body.data.description).toBe('用于单元测试');
        createdRoleIds.push(body.data.id);
    });
    // ─── Slice 2: 角色列表 ─────────────────────────────────────
    it('GET /api/roles - 分页查询角色列表', async () => {
        app = await buildTestApp();
        // 创建 2 个角色
        for (let i = 0; i < 2; i++) {
            const r = await prisma.role.create({
                data: { name: `列表角色_${i}`, code: uniqueCode() },
            });
            createdRoleIds.push(r.id);
        }
        const response = await app.inject({
            method: 'GET',
            url: '/api/roles?page=1&pageSize=10',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
        expect(body.data.total).toBeGreaterThanOrEqual(2);
        expect(body.data.page).toBe(1);
        expect(body.data.pageSize).toBe(10);
    });
    it('GET /api/roles - 按关键词搜索', async () => {
        app = await buildTestApp();
        const keyword = `关键词角色_${Date.now()}`;
        const r = await prisma.role.create({
            data: { name: keyword, code: uniqueCode() },
        });
        createdRoleIds.push(r.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/roles?page=1&pageSize=10&keyword=${encodeURIComponent('关键词角色')}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.list.some((item) => item.name === keyword)).toBe(true);
    });
    // ─── Slice 3: 获取单条 ─────────────────────────────────────
    it('GET /api/roles/:id - 获取角色详情', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({
            data: { name: '详情角色', code: uniqueCode(), description: '详情描述' },
        });
        createdRoleIds.push(r.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/roles/${r.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(r.id);
        expect(body.data.name).toBe('详情角色');
        expect(body.data.description).toBe('详情描述');
    });
    it('GET /api/roles/:id - 不存在的ID返回null', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'GET',
            url: '/api/roles/99999',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
    });
    // ─── Slice 4: 更新角色 ─────────────────────────────────────
    it('PUT /api/roles/:id - 更新角色', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({
            data: { name: '更新前', code: uniqueCode() },
        });
        createdRoleIds.push(r.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roles/${r.id}`,
            payload: { name: '更新后', description: '更新描述' },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('更新后');
        expect(body.data.description).toBe('更新描述');
    });
    // ─── Slice 5: 软删除角色 ───────────────────────────────────
    it('DELETE /api/roles/:id - 软删除角色', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({
            data: { name: '删除角色', code: uniqueCode() },
        });
        createdRoleIds.push(r.id);
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/roles/${r.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
        const found = await prisma.role.findUnique({ where: { id: r.id } });
        expect(found?.deletedAt).not.toBeNull();
    });
    // ─── Slice 6-7: 角色-权限分配 ──────────────────────────────
    it('PUT /api/roles/:id/permissions - 覆盖式分配权限', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({ data: { name: '权限角色', code: uniqueCode() } });
        createdRoleIds.push(r.id);
        const p1 = await createPermission();
        const p2 = await createPermission();
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roles/${r.id}/permissions`,
            payload: { permissionIds: [p1.id, p2.id] },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeTypeOf('number');
        const links = await prisma.rolePermission.findMany({ where: { roleId: r.id } });
        expect(links.length).toBe(2);
    });
    it('PUT /api/roles/:id/permissions - 重新分配覆盖旧权限', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({ data: { name: '覆盖角色', code: uniqueCode() } });
        createdRoleIds.push(r.id);
        const p1 = await createPermission();
        const p2 = await createPermission();
        const p3 = await createPermission();
        // 先分配 p1, p2
        await app.inject({
            method: 'PUT',
            url: `/api/roles/${r.id}/permissions`,
            payload: { permissionIds: [p1.id, p2.id] },
        });
        // 再分配 p3（覆盖）
        await app.inject({
            method: 'PUT',
            url: `/api/roles/${r.id}/permissions`,
            payload: { permissionIds: [p3.id] },
        });
        const links = await prisma.rolePermission.findMany({ where: { roleId: r.id } });
        expect(links.length).toBe(1);
        expect(links[0].permissionId).toBe(p3.id);
    });
    it('PUT /api/roles/:id/permissions - 不存在的权限ID返回错误', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({ data: { name: '错误角色', code: uniqueCode() } });
        createdRoleIds.push(r.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roles/${r.id}/permissions`,
            payload: { permissionIds: [99999] },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.code).not.toBe(0);
    });
    it('GET /api/roles/:id/permissions - 查询角色权限列表', async () => {
        app = await buildTestApp();
        const r = await prisma.role.create({ data: { name: '查询角色', code: uniqueCode() } });
        createdRoleIds.push(r.id);
        const p1 = await createPermission('用户管理');
        const p2 = await createPermission('用户管理');
        await prisma.rolePermission.createMany({
            data: [
                { roleId: r.id, permissionId: p1.id },
                { roleId: r.id, permissionId: p2.id },
            ],
        });
        const response = await app.inject({
            method: 'GET',
            url: `/api/roles/${r.id}/permissions`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBe(2);
        expect(body.data[0]).toHaveProperty('code');
        expect(body.data[0]).toHaveProperty('name');
        expect(body.data[0]).toHaveProperty('group');
    });
});
// ─── Slice 8: 权限列表 ───────────────────────────────────────
describe('Permission Routes - 权限', () => {
    let app;
    const createdPermissionIds = [];
    afterEach(async () => {
        for (const id of createdPermissionIds) {
            try {
                await prisma.permission.delete({ where: { id } });
            }
            catch { }
        }
        createdPermissionIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('GET /api/permissions - 查询所有权限', async () => {
        app = await buildTestApp();
        const p = await prisma.permission.create({
            data: {
                code: `perm_${Math.random().toString(36).slice(2, 10)}`,
                name: `权限_${Date.now()}`,
                group: '系统管理',
            },
        });
        createdPermissionIds.push(p.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/permissions',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(1);
        expect(body.data.some((item) => item.id === p.id)).toBe(true);
    });
    it('GET /api/permissions?group=xxx - 按 group 过滤', async () => {
        app = await buildTestApp();
        const p = await prisma.permission.create({
            data: {
                code: `perm_${Math.random().toString(36).slice(2, 10)}`,
                name: `过滤权限_${Date.now()}`,
                group: '过滤组',
            },
        });
        createdPermissionIds.push(p.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/permissions?group=${encodeURIComponent('过滤组')}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.every((item) => item.group === '过滤组')).toBe(true);
    });
});
// ─── Slice 9: 用户-角色分配 ─────────────────────────────────
describe('User Routes - 用户角色', () => {
    let app;
    const createdUserIds = [];
    const createdRoleIds = [];
    const uniqueCode = () => `r_${Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')}`;
    afterEach(async () => {
        for (const id of createdUserIds) {
            try {
                await prisma.userRole.deleteMany({ where: { userId: id } });
            }
            catch { }
            try {
                await prisma.user.delete({ where: { id } });
            }
            catch { }
        }
        createdUserIds.length = 0;
        for (const id of createdRoleIds) {
            try {
                await prisma.role.update({ where: { id }, data: { deletedAt: new Date() } });
            }
            catch { }
            try {
                await prisma.role.delete({ where: { id } });
            }
            catch { }
        }
        createdRoleIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('PUT /api/users/:id/roles - 给用户分配角色（覆盖式）', async () => {
        app = await buildTestApp();
        const u = await prisma.user.create({
            data: { username: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, passwordHash: 'dummy' },
        });
        createdUserIds.push(u.id);
        const r1 = await prisma.role.create({ data: { name: '角色1', code: uniqueCode() } });
        const r2 = await prisma.role.create({ data: { name: '角色2', code: uniqueCode() } });
        createdRoleIds.push(r1.id, r2.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/users/${u.id}/roles`,
            payload: { roleIds: [r1.id, r2.id] },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeTypeOf('number');
        const links = await prisma.userRole.findMany({ where: { userId: u.id } });
        expect(links.length).toBe(2);
    });
    it('PUT /api/users/:id/roles - 重新分配覆盖旧角色', async () => {
        app = await buildTestApp();
        const u = await prisma.user.create({
            data: { username: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, passwordHash: 'dummy' },
        });
        createdUserIds.push(u.id);
        const r1 = await prisma.role.create({ data: { name: '旧角色', code: uniqueCode() } });
        const r2 = await prisma.role.create({ data: { name: '新角色', code: uniqueCode() } });
        createdRoleIds.push(r1.id, r2.id);
        await app.inject({
            method: 'PUT',
            url: `/api/users/${u.id}/roles`,
            payload: { roleIds: [r1.id] },
        });
        await app.inject({
            method: 'PUT',
            url: `/api/users/${u.id}/roles`,
            payload: { roleIds: [r2.id] },
        });
        const links = await prisma.userRole.findMany({ where: { userId: u.id } });
        expect(links.length).toBe(1);
        expect(links[0].roleId).toBe(r2.id);
    });
    it('PUT /api/users/:id/roles - 不存在的角色ID返回错误', async () => {
        app = await buildTestApp();
        const u = await prisma.user.create({
            data: { username: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, passwordHash: 'dummy' },
        });
        createdUserIds.push(u.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/users/${u.id}/roles`,
            payload: { roleIds: [99999] },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.code).not.toBe(0);
    });
});
//# sourceMappingURL=role.route.test.js.map