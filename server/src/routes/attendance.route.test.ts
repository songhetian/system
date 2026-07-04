import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('Attendance Routes - 打卡记录', () => {
  let app: FastifyInstance;
  let testEmployeeId: number;
  let testShiftId: number;
  const createdRecordIds: number[] = [];
  const createdScheduleIds: number[] = [];

  const createTestEmployee = async () => {
    const emp = await prisma.employee.create({
      data: {
        name: `测试员工_${Date.now()}`,
        employeeNo: `TEST_ATT_${Date.now()}`,
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        status: 'ACTIVE',
      },
    });
    testEmployeeId = emp.id;
    return emp;
  };

  const createTestShiftTemplate = async () => {
    const shift = await prisma.shiftTemplate.create({
      data: {
        name: `早班_ATT_${Date.now()}`,
        startTime: '09:00',
        endTime: '18:00',
        color: '#FF5733',
      },
    });
    testShiftId = shift.id;
    return shift;
  };

  const createTestSchedule = async (date: string) => {
    const s = await prisma.schedule.create({
      data: {
        employeeId: testEmployeeId,
        shiftTemplateId: testShiftId,
        date: new Date(date),
      },
    });
    createdScheduleIds.push(s.id);
    return s;
  };

  afterEach(async () => {
    for (const id of createdRecordIds) {
      try { await prisma.attendanceRecord.delete({ where: { id } }); } catch {}
    }
    createdRecordIds.length = 0;
    for (const id of createdScheduleIds) {
      try { await prisma.schedule.delete({ where: { id } }); } catch {}
    }
    createdScheduleIds.length = 0;
    if (testShiftId) {
      try {
        await prisma.schedule.deleteMany({ where: { shiftTemplateId: testShiftId } });
        await prisma.shiftTemplate.delete({ where: { id: testShiftId } });
      } catch {}
    }
    if (testEmployeeId) {
      try {
        await prisma.attendanceRecord.deleteMany({ where: { employeeId: testEmployeeId } });
        await prisma.schedule.deleteMany({ where: { employeeId: testEmployeeId } });
        await prisma.employee.delete({ where: { id: testEmployeeId } });
      } catch {}
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /api/attendance/attendance-records/clock - 上班打卡', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    await createTestShiftTemplate();
    await createTestSchedule('2025-01-15');

    const clockTime = new Date('2025-01-15T08:30:00');

    const response = await app.inject({
      method: 'POST',
      url: '/api/attendance/attendance-records/clock',
      payload: {
        employeeId: testEmployeeId,
        type: 'IN',
        timestamp: clockTime.toISOString(),
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.type).toBe('IN');
    expect(body.data.employeeId).toBe(testEmployeeId);
    createdRecordIds.push(body.data.id);
  });

  it('POST /api/attendance/attendance-records/clock - 下班打卡（早退计算）', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    await createTestShiftTemplate();
    await createTestSchedule('2025-01-15');

    const clockTime = new Date('2025-01-15T17:00:00');

    const response = await app.inject({
      method: 'POST',
      url: '/api/attendance/attendance-records/clock',
      payload: {
        employeeId: testEmployeeId,
        type: 'OUT',
        timestamp: clockTime.toISOString(),
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.type).toBe('OUT');
    expect(body.data.earlyMinutes).toBeGreaterThan(0);
    createdRecordIds.push(body.data.id);
  });

  it('POST /api/attendance/attendance-records/clock - 迟到打卡（迟到计算）', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    await createTestShiftTemplate();
    await createTestSchedule('2025-01-15');

    const clockTime = new Date('2025-01-15T09:30:00');

    const response = await app.inject({
      method: 'POST',
      url: '/api/attendance/attendance-records/clock',
      payload: {
        employeeId: testEmployeeId,
        type: 'IN',
        timestamp: clockTime.toISOString(),
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.lateMinutes).toBeGreaterThan(0);
    createdRecordIds.push(body.data.id);
  });

  it('GET /api/attendance/attendance-records - 查询打卡记录列表', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r1 = await prisma.attendanceRecord.create({
      data: {
        employeeId: testEmployeeId,
        type: 'IN',
        timestamp: new Date('2025-01-15T08:30:00'),
        lateMinutes: 0,
        earlyMinutes: 0,
      },
    });
    const r2 = await prisma.attendanceRecord.create({
      data: {
        employeeId: testEmployeeId,
        type: 'OUT',
        timestamp: new Date('2025-01-15T18:00:00'),
        lateMinutes: 0,
        earlyMinutes: 0,
      },
    });
    createdRecordIds.push(r1.id, r2.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/attendance/attendance-records?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/attendance/attendance-records - 按员工ID查询', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r = await prisma.attendanceRecord.create({
      data: {
        employeeId: testEmployeeId,
        type: 'IN',
        timestamp: new Date('2025-01-15T08:30:00'),
        lateMinutes: 0,
        earlyMinutes: 0,
      },
    });
    createdRecordIds.push(r.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/attendance/attendance-records?page=1&pageSize=10&employeeId=${testEmployeeId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.list.length).toBeGreaterThanOrEqual(1);
    expect(body.data.list[0].employeeId).toBe(testEmployeeId);
  });

  it('GET /api/attendance/attendance-records - 按日期范围查询', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r = await prisma.attendanceRecord.create({
      data: {
        employeeId: testEmployeeId,
        type: 'IN',
        timestamp: new Date('2025-01-15T08:30:00'),
        lateMinutes: 0,
        earlyMinutes: 0,
      },
    });
    createdRecordIds.push(r.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/attendance/attendance-records?page=1&pageSize=10&dateFrom=2025-01-01&dateTo=2025-01-31',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.list.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/attendance/attendance-records/:id - 根据ID获取打卡记录', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const r = await prisma.attendanceRecord.create({
      data: {
        employeeId: testEmployeeId,
        type: 'IN',
        timestamp: new Date('2025-01-15T08:30:00'),
        lateMinutes: 0,
        earlyMinutes: 0,
      },
    });
    createdRecordIds.push(r.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/attendance/attendance-records/${r.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(r.id);
    expect(body.data.type).toBe('IN');
  });

  it('GET /api/attendance/attendance-records/:id - 不存在的ID返回null', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/attendance/attendance-records/99999',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();
  });
});

describe('Attendance Routes - 考勤台账', () => {
  let app: FastifyInstance;
  let testEmployeeId: number;
  const createdSummaryIds: number[] = [];

  const createTestEmployee = async () => {
    const emp = await prisma.employee.create({
      data: {
        name: `测试员工_${Date.now()}`,
        employeeNo: `TEST_SUM_${Date.now()}`,
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        status: 'ACTIVE',
      },
    });
    testEmployeeId = emp.id;
    return emp;
  };

  const createTestSummary = async () => {
    const s = await prisma.attendanceSummary.create({
      data: {
        employeeId: testEmployeeId,
        year: 2025,
        month: 1,
        shouldWorkDays: 22,
        actualWorkDays: 20,
        lateCount: 2,
        earlyCount: 1,
        absentDays: 2,
        locked: false,
      },
    });
    createdSummaryIds.push(s.id);
    return s;
  };

  afterEach(async () => {
    for (const id of createdSummaryIds) {
      try { await prisma.attendanceSummary.delete({ where: { id } }); } catch {}
    }
    createdSummaryIds.length = 0;
    if (testEmployeeId) {
      try {
        await prisma.attendanceSummary.deleteMany({ where: { employeeId: testEmployeeId } });
        await prisma.employee.delete({ where: { id: testEmployeeId } });
      } catch {}
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /api/attendance/attendance-summaries/generate - 生成月度考勤台账（接口连通性）', async () => {
    // ponytail: generate 遍历全量员工，全量测试时 DB 负载高，给 15s 超时
    app = await buildTestApp();
    await createTestEmployee();

    const response = await app.inject({
      method: 'POST',
      url: '/api/attendance/attendance-summaries/generate',
      payload: { year: 2025, month: 1 },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
  }, 15000);

  it('GET /api/attendance/attendance-summaries - 查询考勤台账列表', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    await createTestSummary();

    const response = await app.inject({
      method: 'GET',
      url: '/api/attendance/attendance-summaries?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/attendance/attendance-summaries/:id - 根据ID获取考勤台账', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    const s = await createTestSummary();

    const response = await app.inject({
      method: 'GET',
      url: `/api/attendance/attendance-summaries/${s.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(s.id);
    expect(body.data.year).toBe(2025);
    expect(body.data.month).toBe(1);
  });

  it('POST /api/attendance/attendance-summaries/:id/lock - 锁定考勤台账', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    const s = await createTestSummary();

    const response = await app.inject({
      method: 'POST',
      url: `/api/attendance/attendance-summaries/${s.id}/lock`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.locked).toBe(true);
  });

  it('POST /api/attendance/attendance-summaries/:id/unlock - 解锁考勤台账', async () => {
    app = await buildTestApp();
    await createTestEmployee();

    const s = await prisma.attendanceSummary.create({
      data: {
        employeeId: testEmployeeId,
        year: 2025,
        month: 1,
        shouldWorkDays: 22,
        actualWorkDays: 20,
        lateCount: 2,
        earlyCount: 1,
        absentDays: 2,
        locked: true,
      },
    });
    createdSummaryIds.push(s.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/attendance/attendance-summaries/${s.id}/unlock`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.locked).toBe(false);
  });
});
