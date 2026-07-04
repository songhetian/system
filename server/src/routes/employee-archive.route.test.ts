import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('EmployeeArchive Routes', () => {
  let app: FastifyInstance;
  const createdContractIds: number[] = [];
  const createdEventIds: number[] = [];
  const createdEmployeeIds: number[] = [];
  const createdPositionIds: number[] = [];
  const createdDeptIds: number[] = [];
  const createdRankIds: number[] = [];

  const setupEmployee = async () => {
    const dept = await prisma.department.create({
      data: { name: `档案部门_${Date.now()}`, sortOrder: 1 },
    });
    createdDeptIds.push(dept.id);

    const rank = await prisma.rank.create({
      data: { name: `P9_${Date.now()}`, level: Math.floor(9000 + Math.random() * 1000) },
    });
    createdRankIds.push(rank.id);

    const pos = await prisma.position.create({
      data: { name: `档案岗位_${Date.now()}`, departmentId: dept.id, rankId: rank.id },
    });
    createdPositionIds.push(pos.id);

    const emp = await prisma.employee.create({
      data: {
        name: `档案员工_${Date.now()}`,
        employeeNo: `ARC_${Date.now().toString().slice(-12)}`.slice(0, 20),
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(emp.id);
    return { dept, rank, pos, emp };
  };

  afterEach(async () => {
    for (const id of createdEventIds) {
      try { await prisma.employeeEvent.delete({ where: { id } }); } catch {}
    }
    createdEventIds.length = 0;

    for (const id of createdContractIds) {
      try { await prisma.employeeContract.delete({ where: { id } }); } catch {}
    }
    createdContractIds.length = 0;

    for (const id of createdEmployeeIds) {
      try { await prisma.employeePosition.deleteMany({ where: { employeeId: id } }); } catch {}
      try { await prisma.employee.delete({ where: { id } }); } catch {}
    }
    createdEmployeeIds.length = 0;

    for (const id of createdPositionIds) {
      try { await prisma.position.delete({ where: { id } }); } catch {}
    }
    createdPositionIds.length = 0;

    for (const id of createdRankIds) {
      try { await prisma.rank.delete({ where: { id } }); } catch {}
    }
    createdRankIds.length = 0;

    for (const id of createdDeptIds) {
      try { await prisma.department.delete({ where: { id } }); } catch {}
    }
    createdDeptIds.length = 0;

    if (app) {
      await app.close();
    }
  });

  it('POST /api/employee-archive/contracts - 创建合同', async () => {
    app = await buildTestApp();
    const { emp } = await setupEmployee();

    const response = await app.inject({
      method: 'POST',
      url: '/api/employee-archive/contracts',
      payload: {
        employeeId: emp.id,
        type: 'REGULAR',
        startDate: '2024-01-01',
        endDate: '2027-01-01',
        salary: 15000,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBeTypeOf('number');
    expect(body.data.employeeId).toBe(emp.id);
    expect(body.data.type).toBe('REGULAR');
    expect(body.data.status).toBe('ACTIVE');
    createdContractIds.push(body.data.id);
  });

  it('GET /api/employee-archive/:employeeId - 查询档案聚合', async () => {
    app = await buildTestApp();
    const { emp } = await setupEmployee();

    const contract = await prisma.employeeContract.create({
      data: {
        employeeId: emp.id,
        type: 'TRIAL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-04-01'),
        salary: 12000,
      },
    });
    createdContractIds.push(contract.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/employee-archive/${emp.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.contracts)).toBe(true);
    expect(body.data.contracts.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.data.documents)).toBe(true);
    expect(Array.isArray(body.data.events)).toBe(true);
  });

  it('POST /api/employee-archive/events - 创建事件', async () => {
    app = await buildTestApp();
    const { emp } = await setupEmployee();

    const response = await app.inject({
      method: 'POST',
      url: '/api/employee-archive/events',
      payload: {
        employeeId: emp.id,
        type: 'HIRE',
        title: '入职',
        effectiveDate: '2024-01-01',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBeTypeOf('number');
    expect(body.data.employeeId).toBe(emp.id);
    expect(body.data.type).toBe('HIRE');
    expect(body.data.title).toBe('入职');
    createdEventIds.push(body.data.id);
  });
});
