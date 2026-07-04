import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { buildTestApp } from '../utils/test-app.js';
describe('Permission Middleware - RBAC 权限校验', () => {
    let app;
    const setupTestData = async () => {
        await prisma.user.upsert({
            where: { id: 1 },
            create: { id: 1, username: 'testuser', passwordHash: 'test' },
            update: {},
        });
        let role = await prisma.role.findUnique({ where: { code: 'employee_read' } });
        if (!role) {
            role = await prisma.role.create({
                data: { name: '员工只读', code: 'employee_read' },
            });
        }
        let perm = await prisma.permission.findUnique({ where: { code: 'employee:read' } });
        if (!perm) {
            perm = await prisma.permission.create({
                data: { name: '查看员工', code: 'employee:read', group: 'employee' },
            });
        }
        const rp = await prisma.rolePermission.findFirst({
            where: { roleId: role.id, permissionId: perm.id },
        });
        if (!rp) {
            await prisma.rolePermission.create({
                data: { roleId: role.id, permissionId: perm.id },
            });
        }
        const ur = await prisma.userRole.findFirst({
            where: { userId: 1, roleId: role.id },
        });
        if (!ur) {
            await prisma.userRole.create({
                data: { userId: 1, roleId: role.id },
            });
        }
    };
    beforeAll(async () => {
        await setupTestData();
    });
    // ─── 无权限时返回 403 ─────────────────────────────────
    it('GET /api/employees - 无 employee:read 权限时返回 403', async () => {
        app = await buildTestApp({ skipAuth: false, employeeId: 1 });
        const token = app.jwt.sign({ id: 999, username: 'noperm', employeeId: 1 });
        const response = await app.inject({
            method: 'GET',
            url: '/api/employees',
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(20001);
    });
    // ─── 有权限时正常返回 ─────────────────────────────────
    it('GET /api/employees - 有 employee:read 权限时返回 200', async () => {
        app = await buildTestApp({ skipAuth: false, employeeId: 1 });
        const token = app.jwt.sign({ id: 1, username: 'testuser', employeeId: 1 });
        const response = await app.inject({
            method: 'GET',
            url: '/api/employees',
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
    });
});
//# sourceMappingURL=permission-middleware.test.js.map