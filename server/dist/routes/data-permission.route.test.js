import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('DataPermission Routes', () => {
    let app;
    const createdPermissionIds = [];
    const createdRoleIds = [];
    afterEach(async () => {
        for (const id of createdPermissionIds) {
            try {
                await prisma.dataPermission.delete({ where: { id } });
            }
            catch { }
        }
        createdPermissionIds.length = 0;
        for (const id of createdRoleIds) {
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
    it('POST /api/data-permissions - 创建数据权限', async () => {
        app = await buildTestApp();
        const role = await prisma.role.create({
            data: { name: `测试角色_${Date.now()}`, code: `test_${Date.now()}` },
        });
        createdRoleIds.push(role.id);
        const response = await app.inject({
            method: 'POST',
            url: '/api/data-permissions',
            payload: {
                roleId: role.id,
                resourceType: 'employee',
                scope: 'ALL',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBeTypeOf('number');
        expect(body.data.roleId).toBe(role.id);
        expect(body.data.resourceType).toBe('employee');
        expect(body.data.scope).toBe('ALL');
        createdPermissionIds.push(body.data.id);
    });
    it('GET /api/data-permissions - 查询数据权限列表', async () => {
        app = await buildTestApp();
        const perm = await prisma.dataPermission.create({
            data: { resourceType: 'salary', scope: 'OWN' },
        });
        createdPermissionIds.push(perm.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/data-permissions?resourceType=salary',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
        expect(body.data.total).toBeGreaterThanOrEqual(1);
    });
    it('PUT /api/data-permissions/:id - 更新数据权限', async () => {
        app = await buildTestApp();
        const perm = await prisma.dataPermission.create({
            data: { resourceType: 'attendance', scope: 'OWN' },
        });
        createdPermissionIds.push(perm.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/data-permissions/${perm.id}`,
            payload: {
                resourceType: 'attendance',
                scope: 'ALL',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.scope).toBe('ALL');
    });
    it('DELETE /api/data-permissions/:id - 删除数据权限', async () => {
        app = await buildTestApp();
        const perm = await prisma.dataPermission.create({
            data: { resourceType: 'expense', scope: 'DEPARTMENT' },
        });
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/data-permissions/${perm.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
        const found = await prisma.dataPermission.findUnique({ where: { id: perm.id } });
        expect(found).toBeNull();
    });
});
//# sourceMappingURL=data-permission.route.test.js.map