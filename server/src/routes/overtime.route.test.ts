import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('Overtime Routes - 加班管理', () => {
  let app: FastifyInstance;
  let testEmployeeId: number;
  const createdRequestIds: number[] = [];
  const createdRecordIds: number[] = [];

  const createTestEmployee = async () => {
    const emp = await prisma.employee.create({
      data: {
        name: `测试员工_${Date.now()}`,
        employeeNo: `TEST_OT_${Date.now()}`,
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
    for (const id of createdRecordIds) {
      try {
        await prisma.overtimeRecord.delete({ where: { id } });
      } catch {}
    }
    createdRecordIds.length = 0;
    for (const id of createdRequestIds) {
      try {
        await prisma.overtimeRequest.delete({ where: { id } });
      } catch {}
    }
    createdRequestIds.length = 0;
    if (testEmployeeId) {
      try {
        await prisma.overtimeRecord.deleteMany({ where: { employeeId: testEmployeeId } });
        await prisma.overtimeRequest.deleteMany({ where: { employeeId: testEmployeeId } });
        await prisma.employee.delete({ where: { id: testEmployeeId } });
      } catch {}
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /api/overtime - 创建加班申请', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const response = await app.inject({
      method: 'POST',
      url: '/api/overtime',
      payload: {
        employeeId: testEmployeeId,
        type: 'WEEKDAY',
        startDateTime: '2025-06-01T18:00:00.000Z',
        endDateTime: '2025-06-01T21:00:00.000Z',
        reason: '项目紧急上线',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.type).toBe('WEEKDAY');
    expect(body.data.status).toBe('PENDING');
    expect(Number(body.data.approvedHours)).toBe(3);
    createdRequestIds.push(body.data.id);
  });

  it('GET /api/overtime - 查询加班申请列表', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r = await prisma.overtimeRequest.create({
      data: {
        employeeId: testEmployeeId,
        type: 'WEEKEND',
        startDateTime: new Date('2025-06-07T09:00:00.000Z'),
        endDateTime: new Date('2025-06-07T17:00:00.000Z'),
        reason: '周末值班',
        status: 'PENDING',
        approvedHours: 8,
      },
    });
    createdRequestIds.push(r.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/overtime?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/overtime/:id/approve - 审批通过加班申请', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r = await prisma.overtimeRequest.create({
      data: {
        employeeId: testEmployeeId,
        type: 'WEEKDAY',
        startDateTime: new Date('2025-06-01T18:00:00.000Z'),
        endDateTime: new Date('2025-06-01T21:00:00.000Z'),
        reason: '项目紧急上线',
        status: 'PENDING',
        approvedHours: 3,
      },
    });
    createdRequestIds.push(r.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/overtime/${r.id}/approve`,
      payload: { approvedHours: 3 },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('APPROVED');
  });

  it('POST /api/overtime/:id/reject - 拒绝加班申请', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r = await prisma.overtimeRequest.create({
      data: {
        employeeId: testEmployeeId,
        type: 'HOLIDAY',
        startDateTime: new Date('2025-05-01T09:00:00.000Z'),
        endDateTime: new Date('2025-05-01T18:00:00.000Z'),
        reason: '节假日加班',
        status: 'PENDING',
        approvedHours: 9,
      },
    });
    createdRequestIds.push(r.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/overtime/${r.id}/reject`,
      payload: { reason: '不符合加班条件' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('REJECTED');
  });
});
