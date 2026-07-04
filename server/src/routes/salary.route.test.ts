import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('Salary Routes - 薪资结构', () => {
  let app: FastifyInstance;
  const createdStructureIds: number[] = [];
  const createdAssignmentIds: number[] = [];
  const createdEmployeeIds: number[] = [];
  const createdPositionIds: number[] = [];
  const createdDeptIds: number[] = [];
  const createdRankIds: number[] = [];
  const createdPayslipIds: number[] = [];

  const setupEmployee = async () => {
    const dept = await prisma.department.create({
      data: { name: `薪资部门_${Date.now()}`, sortOrder: 1 },
    });
    createdDeptIds.push(dept.id);

    const rank = await prisma.rank.create({
      data: { name: `P7_${Date.now()}`, level: Math.floor(7000 + Math.random() * 1000) },
    });
    createdRankIds.push(rank.id);

    const pos = await prisma.position.create({
      data: { name: `薪资岗位_${Date.now()}`, departmentId: dept.id, rankId: rank.id },
    });
    createdPositionIds.push(pos.id);

    const emp = await prisma.employee.create({
      data: {
        name: `薪资员工_${Date.now()}`,
        employeeNo: `SAL_${Date.now().toString().slice(-12)}`.slice(0, 20),
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
    for (const id of createdPayslipIds) {
      try { await prisma.payslip.delete({ where: { id } }); } catch {}
    }
    createdPayslipIds.length = 0;

    for (const id of createdAssignmentIds) {
      try { await prisma.salaryStructureAssignment.delete({ where: { id } }); } catch {}
    }
    createdAssignmentIds.length = 0;

    for (const id of createdStructureIds) {
      try { await prisma.salaryStructure.delete({ where: { id } }); } catch {}
    }
    createdStructureIds.length = 0;

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

  // ─── Slice 1: 创建薪资结构 ───────────────────────────────
  it('POST /api/salary/structures - 创建薪资结构', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary/structures',
      payload: {
        name: '标准薪资结构',
        items: [
          { type: 'BASE', name: '基本工资', formula: '5000', sortOrder: 0 },
          { type: 'PERFORMANCE', name: '绩效奖金', formula: 'base * 0.2', sortOrder: 1 },
          { type: 'INSURANCE', name: '社保', formula: '-500', sortOrder: 2 },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBeTypeOf('number');
    expect(body.data.name).toBe('标准薪资结构');
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.items.length).toBe(3);
    createdStructureIds.push(body.data.id);
  });

  it('POST /api/salary/structures - 空 items 返回错误', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary/structures',
      payload: { name: '无效结构', items: [] },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).not.toBe(0);
  });

  // ─── Slice 2: 薪资结构列表 ───────────────────────────────
  it('GET /api/salary/structures - 查询薪资结构列表', async () => {
    app = await buildTestApp();
    for (let i = 0; i < 2; i++) {
      const s = await prisma.salaryStructure.create({
        data: { name: `结构_${i}`, items: [{ type: 'BASE', name: '工资', formula: '5000', sortOrder: 0 }] },
      });
      createdStructureIds.push(s.id);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/salary/structures?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(2);
  });

  // ─── Slice 3: 单条获取/更新/删除 ───────────────────────────
  it('GET /api/salary/structures/:id - 获取薪资结构详情', async () => {
    app = await buildTestApp();
    const s = await prisma.salaryStructure.create({
      data: { name: '详情结构', items: [{ type: 'BASE', name: '工资', formula: '8000', sortOrder: 0 }] },
    });
    createdStructureIds.push(s.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/salary/structures/${s.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(s.id);
    expect(body.data.name).toBe('详情结构');
  });

  it('PUT /api/salary/structures/:id - 更新薪资结构', async () => {
    app = await buildTestApp();
    const s = await prisma.salaryStructure.create({
      data: { name: '更新前', items: [{ type: 'BASE', name: '工资', formula: '5000', sortOrder: 0 }] },
    });
    createdStructureIds.push(s.id);

    const response = await app.inject({
      method: 'PUT',
      url: `/api/salary/structures/${s.id}`,
      payload: { name: '更新后', items: [{ type: 'BASE', name: '基本工资', formula: '6000', sortOrder: 0 }] },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.name).toBe('更新后');
  });

  it('DELETE /api/salary/structures/:id - 删除薪资结构', async () => {
    app = await buildTestApp();
    const s = await prisma.salaryStructure.create({
      data: { name: '删除结构', items: [{ type: 'BASE', name: '工资', formula: '5000', sortOrder: 0 }] },
    });
    createdStructureIds.push(s.id);

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/salary/structures/${s.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();

    const found = await prisma.salaryStructure.findUnique({ where: { id: s.id } });
    expect(found).toBeNull();
  });

  // ─── Slice 4: 分配给员工 ───────────────────────────────────
  it('POST /api/salary/structures/:id/assign - 分配薪资结构给员工', async () => {
    app = await buildTestApp();
    const { emp } = await setupEmployee();
    const s = await prisma.salaryStructure.create({
      data: { name: '分配结构', items: [{ type: 'BASE', name: '工资', formula: '5000', sortOrder: 0 }] },
    });
    createdStructureIds.push(s.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/salary/structures/${s.id}/assign`,
      payload: { employeeIds: [emp.id] },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.count).toBe(1);

    const assignment = await prisma.salaryStructureAssignment.findUnique({
      where: { employeeId: emp.id },
    });
    expect(assignment?.structureId).toBe(s.id);
    createdAssignmentIds.push(assignment!.id);
  });

  it('POST /api/salary/structures/:id/assign - 员工已分配其他结构则覆盖', async () => {
    app = await buildTestApp();
    const { emp } = await setupEmployee();

    const s1 = await prisma.salaryStructure.create({
      data: { name: '旧结构', items: [{ type: 'BASE', name: '工资', formula: '5000', sortOrder: 0 }] },
    });
    createdStructureIds.push(s1.id);

    const s2 = await prisma.salaryStructure.create({
      data: { name: '新结构', items: [{ type: 'BASE', name: '工资', formula: '6000', sortOrder: 0 }] },
    });
    createdStructureIds.push(s2.id);

    // 先分配 s1
    await prisma.salaryStructureAssignment.create({
      data: { structureId: s1.id, employeeId: emp.id },
    });

    // 再分配 s2（覆盖）
    const response = await app.inject({
      method: 'POST',
      url: `/api/salary/structures/${s2.id}/assign`,
      payload: { employeeIds: [emp.id] },
    });

    expect(response.statusCode).toBe(200);
    const assignment = await prisma.salaryStructureAssignment.findUnique({
      where: { employeeId: emp.id },
    });
    expect(assignment?.structureId).toBe(s2.id);
    createdAssignmentIds.push(assignment!.id);
  });
});

describe('Salary Routes - 工资条', () => {
  let app: FastifyInstance;
  const createdStructureIds: number[] = [];
  const createdAssignmentIds: number[] = [];
  const createdEmployeeIds: number[] = [];
  const createdPositionIds: number[] = [];
  const createdDeptIds: number[] = [];
  const createdRankIds: number[] = [];
  const createdPayslipIds: number[] = [];

  const setupEmployeeWithStructure = async () => {
    const dept = await prisma.department.create({
      data: { name: `工资条部门_${Date.now()}`, sortOrder: 1 },
    });
    createdDeptIds.push(dept.id);

    const rank = await prisma.rank.create({
      data: { name: `P8_${Date.now()}`, level: Math.floor(8000 + Math.random() * 1000) },
    });
    createdRankIds.push(rank.id);

    const pos = await prisma.position.create({
      data: { name: `工资条岗位_${Date.now()}`, departmentId: dept.id, rankId: rank.id },
    });
    createdPositionIds.push(pos.id);

    const emp = await prisma.employee.create({
      data: {
        name: `工资条员工_${Date.now()}`,
        employeeNo: `PAY_${Date.now().toString().slice(-12)}`.slice(0, 20),
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(emp.id);

    const structure = await prisma.salaryStructure.create({
      data: {
        name: '工资条结构',
        items: [
          { type: 'BASE', name: '基本工资', formula: '10000', sortOrder: 0 },
          { type: 'PERFORMANCE', name: '绩效奖金', formula: '1000', sortOrder: 1 },
          { type: 'INSURANCE', name: '社保', formula: '-500', sortOrder: 2 },
          { type: 'TAX', name: '个税', formula: '-200', sortOrder: 3 },
        ],
      },
    });
    createdStructureIds.push(structure.id);

    const assignment = await prisma.salaryStructureAssignment.create({
      data: { structureId: structure.id, employeeId: emp.id },
    });
    createdAssignmentIds.push(assignment.id);

    return { dept, pos, emp, structure };
  };

  afterEach(async () => {
    for (const id of createdPayslipIds) {
      try { await prisma.payslip.delete({ where: { id } }); } catch {}
    }
    createdPayslipIds.length = 0;

    for (const id of createdAssignmentIds) {
      try { await prisma.salaryStructureAssignment.delete({ where: { id } }); } catch {}
    }
    createdAssignmentIds.length = 0;

    for (const id of createdStructureIds) {
      try { await prisma.salaryStructure.delete({ where: { id } }); } catch {}
    }
    createdStructureIds.length = 0;

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

  // ─── Slice 5: 生成工资条 ───────────────────────────────────
  it('POST /api/salary/payslips/generate - 生成工资条', async () => {
    app = await buildTestApp();
    const { emp, dept, pos } = await setupEmployeeWithStructure();

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary/payslips/generate',
      payload: { year: 2025, month: 1, departmentId: null },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.count).toBeGreaterThanOrEqual(1);

    const payslip = await prisma.payslip.findFirst({
      where: { employeeId: emp.id, year: 2025, month: 1 },
    });
    expect(payslip).not.toBeNull();
    expect(payslip!.grossPay.toString()).toBe('11000'); // 10000 + 1000
    expect(payslip!.deductions.toString()).toBe('700'); // 500 + 200
    expect(payslip!.netPay.toString()).toBe('10300'); // 11000 - 700
    createdPayslipIds.push(payslip!.id);
  });

  // ─── Slice 6: 工资条列表（脱敏） ───────────────────────────
  it('GET /api/salary/payslips - 工资条列表（金额脱敏）', async () => {
    app = await buildTestApp();
    const { emp, dept } = await setupEmployeeWithStructure();

    const payslip = await prisma.payslip.create({
      data: {
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: dept.name,
        positionName: '测试岗位',
        year: 2025,
        month: 2,
        items: [{ type: 'BASE', name: '工资', amount: 10000 }],
        grossPay: 10000,
        deductions: 0,
        netPay: 10000,
      },
    });
    createdPayslipIds.push(payslip.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/salary/payslips?page=1&pageSize=10&year=2025&month=2',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    const item = body.data.list.find((p: any) => p.id === payslip.id);
    expect(item).toBeDefined();
    expect(item.grossPay).toBe('****');
    expect(item.deductions).toBe('****');
    expect(item.netPay).toBe('****');
  });

  // ─── Slice 7: 工资条详情（完整金额） ───────────────────────
  it('GET /api/salary/payslips/:id - 工资条详情（完整金额）', async () => {
    app = await buildTestApp();
    const { emp, dept, pos } = await setupEmployeeWithStructure();

    const payslip = await prisma.payslip.create({
      data: {
        employeeId: emp.id,
        employeeName: emp.name,
        departmentName: dept.name,
        positionName: pos.name,
        year: 2025,
        month: 3,
        items: [
          { type: 'BASE', name: '基本工资', amount: 10000 },
          { type: 'PERFORMANCE', name: '绩效', amount: 1000 },
        ],
        grossPay: 11000,
        deductions: 0,
        netPay: 11000,
      },
    });
    createdPayslipIds.push(payslip.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/salary/payslips/${payslip.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(payslip.id);
    expect(body.data.grossPay).toBe(11000);
    expect(body.data.netPay).toBe(11000);
    expect(body.data.items.length).toBe(2);
  });
});

describe('Salary Routes - 审计日志', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  // ─── Slice 8: 审计日志查询 ────────────────────────────────
  it('GET /api/salary/audit-logs - 查询审计日志', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/salary/audit-logs?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
  });
});