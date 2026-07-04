import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { buildTestApp } from '../utils/test-app.js';
describe('Row-Level Permission - 行级数据权限', () => {
    let deptAId;
    let deptBId;
    let rankId;
    let posAId;
    let posBId;
    let empA1Id;
    let empA2Id;
    let empB1Id;
    let userA1Id;
    let userA2Id;
    let userB1Id;
    let leaveRoleId;
    const buildAppWithScope = async (userId, employeeId, scope) => {
        // 清缓存，确保每次读取最新数据权限
        await redis.del(`datascope:user:${userId}`);
        await redis.del(`permissions:user:${userId}`);
        // 给用户设置数据权限
        await prisma.dataPermission.deleteMany({ where: { userId, resourceType: 'leave' } });
        await prisma.dataPermission.create({
            data: { userId, resourceType: 'leave', scope },
        });
        return buildTestApp({ skipAuth: false, employeeId });
    };
    beforeAll(async () => {
        const deptA = await prisma.department.create({
            data: { name: `DeptA_${Date.now()}`, sortOrder: 1 },
        });
        deptAId = deptA.id;
        const deptB = await prisma.department.create({
            data: { name: `DeptB_${Date.now()}`, sortOrder: 2 },
        });
        deptBId = deptB.id;
        const rank = await prisma.rank.create({
            data: { name: `R_${Date.now()}`, level: 5000 },
        });
        rankId = rank.id;
        const posA = await prisma.position.create({
            data: { name: 'PosA', departmentId: deptAId, rankId, headcount: 5 },
        });
        posAId = posA.id;
        const posB = await prisma.position.create({
            data: { name: 'PosB', departmentId: deptBId, rankId, headcount: 5 },
        });
        posBId = posB.id;
        const empA1 = await prisma.employee.create({
            data: {
                name: 'EmpA1', employeeNo: `EA1${Date.now()}`.slice(-20),
                phone: '13800138001', idCard: '110101199001010001',
                hireDate: new Date('2024-01-01'),
                employeePositions: { create: { positionId: posAId, startDate: new Date('2024-01-01') } },
            },
        });
        empA1Id = empA1.id;
        const empA2 = await prisma.employee.create({
            data: {
                name: 'EmpA2', employeeNo: `EA2${Date.now()}`.slice(-20),
                phone: '13800138002', idCard: '110101199001010002',
                hireDate: new Date('2024-01-01'),
                employeePositions: { create: { positionId: posAId, startDate: new Date('2024-01-01') } },
            },
        });
        empA2Id = empA2.id;
        const empB1 = await prisma.employee.create({
            data: {
                name: 'EmpB1', employeeNo: `EB1${Date.now()}`.slice(-20),
                phone: '13800138003', idCard: '110101199001010003',
                hireDate: new Date('2024-01-01'),
                employeePositions: { create: { positionId: posBId, startDate: new Date('2024-01-01') } },
            },
        });
        empB1Id = empB1.id;
        const uA1 = await prisma.user.create({
            data: { username: `ua1_${Date.now()}`, passwordHash: 'x', employeeId: empA1Id },
        });
        userA1Id = uA1.id;
        const uA2 = await prisma.user.create({
            data: { username: `ua2_${Date.now()}`, passwordHash: 'x', employeeId: empA2Id },
        });
        userA2Id = uA2.id;
        const uB1 = await prisma.user.create({
            data: { username: `ub1_${Date.now()}`, passwordHash: 'x', employeeId: empB1Id },
        });
        userB1Id = uB1.id;
        // 请假记录
        await prisma.leaveRequest.createMany({
            data: [
                { employeeId: empA1Id, type: 'ANNUAL', startDate: new Date('2024-06-01'), endDate: new Date('2024-06-02'), startTime: 'ALL', endTime: 'ALL', reason: 'A1' },
                { employeeId: empA2Id, type: 'SICK', startDate: new Date('2024-06-03'), endDate: new Date('2024-06-04'), startTime: 'ALL', endTime: 'ALL', reason: 'A2' },
                { employeeId: empB1Id, type: 'PERSONAL', startDate: new Date('2024-06-05'), endDate: new Date('2024-06-06'), startTime: 'ALL', endTime: 'ALL', reason: 'B1' },
            ],
        });
        // 给角色加 leave:read 权限
        let perm = await prisma.permission.findUnique({ where: { code: 'leave:read' } });
        if (!perm)
            perm = await prisma.permission.create({ data: { name: '请假查看', code: 'leave:read', group: 'leave' } });
        let role = await prisma.role.findUnique({ where: { code: 'leave_read' } });
        if (!role)
            role = await prisma.role.create({ data: { name: '请假查看', code: 'leave_read' } });
        leaveRoleId = role.id;
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
            create: { roleId: role.id, permissionId: perm.id },
            update: {},
        });
        for (const uid of [userA1Id, userA2Id, userB1Id]) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: uid, roleId: role.id } },
                create: { userId: uid, roleId: role.id },
                update: {},
            });
        }
    });
    afterAll(async () => {
        await prisma.leaveRequest.deleteMany({ where: { employeeId: { in: [empA1Id, empA2Id, empB1Id] } } });
        await prisma.dataPermission.deleteMany({ where: { userId: { in: [userA1Id, userA2Id, userB1Id] } } });
        await prisma.userRole.deleteMany({ where: { userId: { in: [userA1Id, userA2Id, userB1Id] } } });
        await prisma.user.deleteMany({ where: { id: { in: [userA1Id, userA2Id, userB1Id] } } });
        await prisma.employeePosition.deleteMany({ where: { employeeId: { in: [empA1Id, empA2Id, empB1Id] } } });
        await prisma.employee.deleteMany({ where: { id: { in: [empA1Id, empA2Id, empB1Id] } } });
        await prisma.position.deleteMany({ where: { id: { in: [posAId, posBId] } } });
        await prisma.rank.delete({ where: { id: rankId } }).catch(() => { });
        await prisma.department.deleteMany({ where: { id: { in: [deptAId, deptBId] } } });
    });
    // ─── OWN 范围 ─────────────────────────────────
    it('OWN 范围：员工只能看到自己的请假记录', async () => {
        const app = await buildAppWithScope(userA1Id, empA1Id, 'OWN');
        const token = app.jwt.sign({ id: userA1Id, username: 'empA1', employeeId: empA1Id });
        const response = await app.inject({
            method: 'GET',
            url: '/api/leave/leave-requests',
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.list.length).toBe(1);
        expect(body.data.list[0].employeeId).toBe(empA1Id);
        await app.close();
    });
    // ─── DEPARTMENT 范围 ─────────────────────────────────
    it('DEPARTMENT 范围：部门主管能看到本部门所有请假', async () => {
        const app = await buildAppWithScope(userA1Id, empA1Id, 'DEPARTMENT');
        const token = app.jwt.sign({ id: userA1Id, username: 'empA1', employeeId: empA1Id });
        const response = await app.inject({
            method: 'GET',
            url: '/api/leave/leave-requests',
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        // 部门A有2个员工，应该返回2条
        const empIds = body.data.list.map((r) => r.employeeId);
        expect(empIds).toContain(empA1Id);
        expect(empIds).toContain(empA2Id);
        expect(empIds).not.toContain(empB1Id);
        await app.close();
    });
    // ─── ALL 范围 ─────────────────────────────────
    it('ALL 范围：HR能看到所有请假记录', async () => {
        const app = await buildAppWithScope(userA1Id, empA1Id, 'ALL');
        const token = app.jwt.sign({ id: userA1Id, username: 'hr', employeeId: empA1Id });
        const response = await app.inject({
            method: 'GET',
            url: '/api/leave/leave-requests',
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.total).toBeGreaterThanOrEqual(3);
        await app.close();
    });
});
//# sourceMappingURL=row-permission.test.js.map