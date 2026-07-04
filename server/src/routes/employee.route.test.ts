import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('Employee Routes', () => {
  let app: FastifyInstance;
  const createdEmployeeIds: number[] = [];
  const createdPositionIds: number[] = [];
  const createdDeptIds: number[] = [];
  const createdRankIds: number[] = [];

  const setupDeptAndPosition = async () => {
    const dept = await prisma.department.create({
      data: { name: `测试部门_${Date.now()}_${Math.random()}`, sortOrder: 1 },
    });
    createdDeptIds.push(dept.id);

    const rank = await prisma.rank.create({
      data: {
        name: `P5_${Date.now()}_${Math.random()}`,
        level: Math.floor(2000 + Math.random() * 8000),
      },
    });
    createdRankIds.push(rank.id);

    const pos = await prisma.position.create({
      data: { name: `测试岗位_${Date.now()}`, departmentId: dept.id, rankId: rank.id, headcount: 5 },
    });
    createdPositionIds.push(pos.id);

    return { dept, rank, pos };
  };

  const createEmployeePayload = (positionId: number, suffix?: string) => ({
    name: `测试员工_${suffix ?? Date.now()}`,
    employeeNo: `E${Date.now().toString().slice(-12)}${suffix ?? ''}`.slice(0, 20),
    phone: '13800138000',
    email: 'test@example.com',
    idCard: '110101199001011234',
    hireDate: '2024-01-01',
    departmentId: 0, // will be set by caller
    positionIds: [positionId],
  });

  afterEach(async () => {
    // 清理 EmployeePosition（中间表会随 Employee 软删而残留，硬删）
    for (const empId of createdEmployeeIds) {
      try {
        await prisma.employeePosition.deleteMany({ where: { employeeId: empId } });
      } catch {}
      try {
        await prisma.employee.update({ where: { id: empId }, data: { deletedAt: new Date() } });
      } catch {}
      try {
        await prisma.employee.delete({ where: { id: empId } });
      } catch {}
    }
    createdEmployeeIds.length = 0;

    for (const id of createdPositionIds) {
      try { await prisma.position.update({ where: { id }, data: { deletedAt: new Date() } }); } catch {}
      try { await prisma.position.delete({ where: { id } }); } catch {}
    }
    createdPositionIds.length = 0;

    for (const id of createdRankIds) {
      try { await prisma.rank.delete({ where: { id } }); } catch {}
    }
    createdRankIds.length = 0;

    for (const id of createdDeptIds) {
      try { await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } }); } catch {}
      try { await prisma.department.delete({ where: { id } }); } catch {}
    }
    createdDeptIds.length = 0;

    if (app) {
      await app.close();
    }
  });

  // ─── 权限控制（TDD 新增） ──────────────────────────────────

  it('无认证用户访问 GET /api/employees 应返回 401', async () => {
    app = await buildTestApp({ skipAuth: false });

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20000);
    expect(body.message).toContain('登录');
  });

  it('无 employee:read 权限的用户访问 GET /api/employees 应返回 403', async () => {
    app = await buildTestApp({ skipAuth: true, permissions: [] });

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20001);
    expect(body.message).toContain('无权限');
  });

  it('无 employee:write 权限的用户 POST 创建员工应返回 403', async () => {
    app = await buildTestApp({ skipAuth: true, permissions: ['employee:read'] });

    const response = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload: {
        name: '测试员工',
        employeeNo: `E${Date.now()}`.slice(0, 20),
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: '2024-01-01',
        departmentId: 1,
        positionIds: [1],
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20001);
  });

  // ─── 创建员工 ──────────────────────────────────────────────

  it('POST /api/employees - 创建员工（含岗位关联）', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const response = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload: {
        ...createEmployeePayload(pos.id),
        departmentId: dept.id,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.name).toContain('测试员工');
    expect(body.data.status).toBe('PROBATION');
    expect(body.data.employeeNo).toContain('E');
    expect(typeof body.data.id).toBe('number');
    createdEmployeeIds.push(body.data.id);

    // 验证 EmployeePosition 关联已创建
    const eps = await prisma.employeePosition.findMany({
      where: { employeeId: body.data.id },
    });
    expect(eps.length).toBe(1);
    expect(eps[0].positionId).toBe(pos.id);
  });

  it('POST /api/employees - employeeNo 重复返回错误', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const payload = {
      ...createEmployeePayload(pos.id),
      departmentId: dept.id,
    };

    // 先创建一个
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload,
    });
    expect(r1.statusCode).toBe(200);
    createdEmployeeIds.push(JSON.parse(r1.body).data.id);

    // 再用相同 employeeNo 创建
    const r2 = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload,
    });

    expect(r2.statusCode).toBe(400);
    const body = JSON.parse(r2.body);
    expect(body.code).not.toBe(0);
  });

  it('POST /api/employees - 部门不存在返回错误', async () => {
    app = await buildTestApp();
    const { pos } = await setupDeptAndPosition();

    const response = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload: {
        ...createEmployeePayload(pos.id),
        departmentId: 99999,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).not.toBe(0);
  });

  it('POST /api/employees - 岗位不存在返回错误', async () => {
    app = await buildTestApp();
    const { dept } = await setupDeptAndPosition();

    const response = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload: {
        ...createEmployeePayload(99999),
        departmentId: dept.id,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).not.toBe(0);
  });

  // ─── 员工列表 ──────────────────────────────────────────────

  it('GET /api/employees - 分页查询员工列表', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e1 = await prisma.employee.create({
      data: {
        name: '列表员工A', employeeNo: `L${Date.now()}1`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    const e2 = await prisma.employee.create({
      data: {
        name: '列表员工B', employeeNo: `L${Date.now()}2`.slice(0, 20),
        phone: '13900139000', idCard: '110101199001011235',
        hireDate: new Date('2024-02-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e1.id, e2.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(2);
    // 列表中 idCard 和 phone 应被脱敏
    const item = body.data.list.find((e: any) => e.id === e1.id);
    expect(item).toBeDefined();
    expect(item.idCard).toBe('****');
    expect(item.phone).toBe('****');
  });

  it('GET /api/employees - 按关键词搜索', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const uniqueName = `搜索员工_${Date.now()}`;
    const e = await prisma.employee.create({
      data: {
        name: uniqueName, employeeNo: `S${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees?page=1&pageSize=10&keyword=${encodeURIComponent('搜索员工')}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.list.some((e: any) => e.name === uniqueName)).toBe(true);
  });

  it('GET /api/employees - 按状态过滤', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: `状态员工_${Date.now()}`, employeeNo: `ST${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'), status: 'ACTIVE',
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?page=1&pageSize=10&status=ACTIVE',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.list.every((e: any) => e.status === 'ACTIVE')).toBe(true);
  });

  // ─── 获取员工详情 ──────────────────────────────────────────

  it('GET /api/employees/:id - 获取员工（脱敏）', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: '详情员工', employeeNo: `D${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${e.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(e.id);
    expect(body.data.name).toBe('详情员工');
    expect(body.data.idCard).toBe('****');
    expect(body.data.phone).toBe('****');
  });

  it('GET /api/employees/:id/detail - 完整详情（不脱敏）', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: '完整详情员工', employeeNo: `F${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        emergencyContact: '紧急联系人',
        emergencyPhone: '13900139000',
        address: '测试地址',
        remark: '测试备注',
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${e.id}/detail`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(e.id);
    expect(body.data.idCard).toBe('110101199001011234');
    expect(body.data.phone).toBe('13800138000');
    expect(body.data.emergencyContact).toBe('紧急联系人');
  });

  it('GET /api/employees/:id - 不存在的员工返回null', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees/99999',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();
  });

  // ─── 更新员工 ──────────────────────────────────────────────

  it('PUT /api/employees/:id - 更新员工信息', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: '更新前', employeeNo: `U${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'PUT',
      url: `/api/employees/${e.id}`,
      payload: { name: '更新后', phone: '13900139000' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.name).toBe('更新后');
  });

  // ─── 软删除员工 ────────────────────────────────────────────

  it('DELETE /api/employees/:id - 软删除员工', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: '删除员工', employeeNo: `DL${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/employees/${e.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();

    const found = await prisma.employee.findUnique({ where: { id: e.id } });
    expect(found?.deletedAt).not.toBeNull();
  });

  // ─── 转正 ──────────────────────────────────────────────────

  it('POST /api/employees/:id/regularize - 员工转正', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: '试用期员工', employeeNo: `R${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'), status: 'PROBATION',
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/employees/${e.id}/regularize`,
      payload: { regularizeDate: '2024-04-01' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('ACTIVE');
    expect(body.data.regularizeDate).toBe('2024-04-01');
  });

  // ─── 离职 ──────────────────────────────────────────────────

  it('POST /api/employees/:id/resign - 员工离职', async () => {
    app = await buildTestApp();
    const { dept, pos } = await setupDeptAndPosition();

    const e = await prisma.employee.create({
      data: {
        name: '离职员工', employeeNo: `RS${Date.now()}`.slice(0, 20),
        phone: '13800138000', idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'), status: 'ACTIVE',
        employeePositions: { create: [{ positionId: pos.id, startDate: new Date() }] },
      },
    });
    createdEmployeeIds.push(e.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/employees/${e.id}/resign`,
      payload: { resignDate: '2024-12-31', reason: '个人原因' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('RESIGNED');
    expect(body.data.resignDate).toBe('2024-12-31');
  });
});
