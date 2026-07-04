import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('Leave Routes - 假期额度', () => {
    let app;
    let testEmployeeId;
    const createdQuotaIds = [];
    const createTestEmployee = async () => {
        const emp = await prisma.employee.create({
            data: {
                name: `测试员工_${Date.now()}`,
                employeeNo: `TEST_${Date.now()}`,
                phone: '13800138000',
                idCard: '110101199001011234',
                hireDate: new Date('2024-01-01'),
                status: 'ACTIVE',
            },
        });
        testEmployeeId = emp.id;
        return emp;
    };
    afterEach(async () => {
        for (const id of createdQuotaIds) {
            try {
                await prisma.leaveQuota.delete({ where: { id } });
            }
            catch { }
        }
        createdQuotaIds.length = 0;
        if (testEmployeeId) {
            try {
                await prisma.leaveQuota.deleteMany({ where: { employeeId: testEmployeeId } });
                await prisma.employee.delete({ where: { id: testEmployeeId } });
            }
            catch { }
        }
        if (app) {
            await app.close();
        }
    });
    it('POST /api/leave/leave-quotas/init - 初始化年度假期额度', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const response = await app.inject({
            method: 'POST',
            url: '/api/leave/leave-quotas/init',
            payload: {
                year: 2025,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(typeof body.data.count).toBe('number');
        expect(body.data.count).toBeGreaterThanOrEqual(1);
    });
    it('GET /api/leave/leave-quotas - 查询假期额度列表', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const q = await prisma.leaveQuota.create({
            data: {
                employeeId: testEmployeeId,
                year: 2025,
                annualBalance: 10,
                annualUsed: 0,
                sickUsed: 0,
                personalUsed: 0,
                compensatoryBalance: 5,
            },
        });
        createdQuotaIds.push(q.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/leave/leave-quotas?page=1&pageSize=10',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
        expect(body.data.total).toBeGreaterThanOrEqual(1);
    });
    it('GET /api/leave/leave-quotas - 按员工ID查询', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const q = await prisma.leaveQuota.create({
            data: {
                employeeId: testEmployeeId,
                year: 2025,
                annualBalance: 10,
                annualUsed: 0,
                sickUsed: 0,
                personalUsed: 0,
                compensatoryBalance: 5,
            },
        });
        createdQuotaIds.push(q.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/leave/leave-quotas?page=1&pageSize=10&employeeId=${testEmployeeId}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.list.length).toBeGreaterThanOrEqual(1);
        expect(body.data.list[0].employeeId).toBe(testEmployeeId);
    });
    it('GET /api/leave/leave-quotas/:id - 根据ID获取假期额度', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const q = await prisma.leaveQuota.create({
            data: {
                employeeId: testEmployeeId,
                year: 2025,
                annualBalance: 10,
                annualUsed: 0,
                sickUsed: 0,
                personalUsed: 0,
                compensatoryBalance: 5,
            },
        });
        createdQuotaIds.push(q.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/leave/leave-quotas/${q.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(q.id);
        expect(body.data.year).toBe(2025);
    });
    it('PUT /api/leave/leave-quotas/:id - 更新假期额度', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const q = await prisma.leaveQuota.create({
            data: {
                employeeId: testEmployeeId,
                year: 2025,
                annualBalance: 10,
                annualUsed: 0,
                sickUsed: 0,
                personalUsed: 0,
                compensatoryBalance: 5,
            },
        });
        createdQuotaIds.push(q.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/leave/leave-quotas/${q.id}`,
            payload: {
                annualBalance: 15,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Number(body.data.annualBalance)).toBe(15);
    });
});
describe('Leave Routes - 请假申请', () => {
    let app;
    let testEmployeeId;
    let testQuotaId;
    const createdRequestIds = [];
    const createTestEmployee = async () => {
        const emp = await prisma.employee.create({
            data: {
                name: `测试员工_${Date.now()}`,
                employeeNo: `TEST_${Date.now()}`,
                phone: '13800138000',
                idCard: '110101199001011234',
                hireDate: new Date('2024-01-01'),
                status: 'ACTIVE',
            },
        });
        testEmployeeId = emp.id;
        return emp;
    };
    const createTestQuota = async () => {
        const q = await prisma.leaveQuota.create({
            data: {
                employeeId: testEmployeeId,
                year: 2025,
                annualBalance: 10,
                annualUsed: 0,
                sickUsed: 0,
                personalUsed: 0,
                compensatoryBalance: 5,
            },
        });
        testQuotaId = q.id;
        return q;
    };
    afterEach(async () => {
        for (const id of createdRequestIds) {
            try {
                await prisma.leaveRequest.delete({ where: { id } });
            }
            catch { }
        }
        createdRequestIds.length = 0;
        if (testQuotaId) {
            try {
                await prisma.leaveQuota.delete({ where: { id: testQuotaId } });
            }
            catch { }
        }
        if (testEmployeeId) {
            try {
                await prisma.leaveRequest.deleteMany({ where: { employeeId: testEmployeeId } });
                await prisma.leaveQuota.deleteMany({ where: { employeeId: testEmployeeId } });
                await prisma.employee.delete({ where: { id: testEmployeeId } });
            }
            catch { }
        }
        if (app) {
            await app.close();
        }
    });
    it('POST /api/leave/leave-requests - 创建请假申请（病假）', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const response = await app.inject({
            method: 'POST',
            url: '/api/leave/leave-requests',
            payload: {
                employeeId: testEmployeeId,
                type: 'SICK',
                startDate: '2025-01-20',
                endDate: '2025-01-21',
                startTime: 'ALL',
                endTime: 'ALL',
                reason: '感冒发烧',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.type).toBe('SICK');
        expect(body.data.status).toBe('PENDING');
        createdRequestIds.push(body.data.id);
    });
    it('POST /api/leave/leave-requests - 创建年假申请（扣除额度）', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestQuota();
        const response = await app.inject({
            method: 'POST',
            url: '/api/leave/leave-requests',
            payload: {
                employeeId: testEmployeeId,
                type: 'ANNUAL',
                startDate: '2025-01-20',
                endDate: '2025-01-21',
                startTime: 'ALL',
                endTime: 'ALL',
                reason: '家中有事',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.type).toBe('ANNUAL');
        expect(body.data.status).toBe('PENDING');
        createdRequestIds.push(body.data.id);
    });
    it('POST /api/leave/leave-requests - 年假余额不足返回错误', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await prisma.leaveQuota.create({
            data: {
                employeeId: testEmployeeId,
                year: 2025,
                annualBalance: 1,
                annualUsed: 0,
                sickUsed: 0,
                personalUsed: 0,
                compensatoryBalance: 0,
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: '/api/leave/leave-requests',
            payload: {
                employeeId: testEmployeeId,
                type: 'ANNUAL',
                startDate: '2025-01-20',
                endDate: '2025-01-25',
                startTime: 'ALL',
                endTime: 'ALL',
                reason: '长假',
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(Number(body.code)).toBe(30002);
    });
    it('GET /api/leave/leave-requests - 查询请假申请列表', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const r = await prisma.leaveRequest.create({
            data: {
                employeeId: testEmployeeId,
                type: 'PERSONAL',
                startDate: new Date('2025-01-20'),
                endDate: new Date('2025-01-20'),
                startTime: 'AM',
                endTime: 'PM',
                reason: '有事',
                status: 'PENDING',
            },
        });
        createdRequestIds.push(r.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/leave/leave-requests?page=1&pageSize=10',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
        expect(body.data.total).toBeGreaterThanOrEqual(1);
    });
    it('GET /api/leave/leave-requests/:id - 根据ID获取请假申请', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const r = await prisma.leaveRequest.create({
            data: {
                employeeId: testEmployeeId,
                type: 'SICK',
                startDate: new Date('2025-01-20'),
                endDate: new Date('2025-01-21'),
                startTime: 'ALL',
                endTime: 'ALL',
                reason: '感冒',
                status: 'PENDING',
            },
        });
        createdRequestIds.push(r.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/leave/leave-requests/${r.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(r.id);
        expect(body.data.type).toBe('SICK');
    });
    it('PUT /api/leave/leave-requests/:id - 更新请假申请', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const r = await prisma.leaveRequest.create({
            data: {
                employeeId: testEmployeeId,
                type: 'PERSONAL',
                startDate: new Date('2025-01-20'),
                endDate: new Date('2025-01-20'),
                startTime: 'AM',
                endTime: 'PM',
                reason: '有事',
                status: 'PENDING',
            },
        });
        createdRequestIds.push(r.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/leave/leave-requests/${r.id}`,
            payload: {
                type: 'SICK',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.type).toBe('SICK');
    });
    it('POST /api/leave/leave-requests/:id/cancel - 取消请假申请', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        const r = await prisma.leaveRequest.create({
            data: {
                employeeId: testEmployeeId,
                type: 'PERSONAL',
                startDate: new Date('2025-01-20'),
                endDate: new Date('2025-01-20'),
                startTime: 'AM',
                endTime: 'PM',
                reason: '有事',
                status: 'PENDING',
            },
        });
        createdRequestIds.push(r.id);
        const response = await app.inject({
            method: 'POST',
            url: `/api/leave/leave-requests/${r.id}/cancel`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.status).toBe('CANCELLED');
    });
});
//# sourceMappingURL=leave.route.test.js.map