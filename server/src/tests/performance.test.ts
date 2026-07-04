import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

// ═══════════════════ 并发基线压测 ═══════════════════
// 决策 #4: 500 在线、CRUD ≤200ms、排班生成 ≤2s 异步

describe('Performance Baseline Tests', () => {
  let app: FastifyInstance;
  const createdEmployeeIds: number[] = [];
  const createdDepartmentIds: number[] = [];
  const createdScheduleIds: number[] = [];

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    for (const id of createdEmployeeIds) {
      try { await prisma.employee.delete({ where: { id } }); } catch {}
    }
    for (const id of createdDepartmentIds) {
      try { await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } }); } catch {}
    }
    for (const id of createdScheduleIds) {
      try { await prisma.schedule.delete({ where: { id } }); } catch {}
    }
    createdEmployeeIds.length = 0;
    createdDepartmentIds.length = 0;
    createdScheduleIds.length = 0;
    if (app) await app.close();
  });

  // ─── CRUD 响应时间测试 ───

  test('GET /api/employees - 列表查询 ≤200ms', async () => {
    const start = Date.now();
    const response = await app.inject({ method: 'GET', url: '/api/employees?page=1&pageSize=20' });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /api/employees: ${duration}ms`);
  });

  test('GET /api/org/departments - 部门树查询 ≤200ms', async () => {
    const start = Date.now();
    const response = await app.inject({ method: 'GET', url: '/api/org/departments/tree' });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /api/org/departments/tree: ${duration}ms`);
  });

  test('GET /api/roles - 角色列表查询 ≤200ms', async () => {
    const start = Date.now();
    const response = await app.inject({ method: 'GET', url: '/api/roles?page=1&pageSize=20' });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /api/roles: ${duration}ms`);
  });

  // ─── 并发请求测试 ───

  test('并发 50 个员工查询请求 ≤5s 总耗时', async () => {
    const start = Date.now();
    const requests = Array(50).fill(null).map(() =>
      app.inject({ method: 'GET', url: '/api/employees?page=1&pageSize=10' })
    );
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    responses.forEach(r => expect(r.statusCode).toBe(200));
    expect(duration).toBeLessThan(5000);
    console.log(`50 并发请求总耗时: ${duration}ms (平均 ${duration/50}ms/请求)`);
  });

  test('并发 20 个部门查询请求 ≤2s 总耗时', async () => {
    const start = Date.now();
    const requests = Array(20).fill(null).map(() =>
      app.inject({ method: 'GET', url: '/api/org/departments?page=1&pageSize=10' })
    );
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    responses.forEach(r => expect(r.statusCode).toBe(200));
    expect(duration).toBeLessThan(2000);
    console.log(`20 并发请求总耗时: ${duration}ms`);
  });

  // ─── 写操作响应时间测试 ───

  test('POST /api/org/departments - 创建部门 ≤200ms', async () => {
    const start = Date.now();
    const response = await app.inject({
      method: 'POST',
      url: '/api/org/departments',
      payload: { name: `压测部门_${Date.now()}`, code: `TEST_${Date.now()}` },
    });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    const body = JSON.parse(response.body);
    createdDepartmentIds.push(body.data.id);
    console.log(`POST /api/org/departments: ${duration}ms`);
  });

  test('POST /api/schedule/schedules - 创建排班 ≤200ms', async () => {
    // 先创建测试员工和班次模板
    const emp = await prisma.employee.create({
      data: { name: '压测员工', employeeNo: `STRESS_${Date.now()}`, phone: '13800138000', idCard: '110101199001011234', hireDate: new Date('2024-01-01') },
    });
    createdEmployeeIds.push(emp.id);

    const template = await prisma.shiftTemplate.create({
      data: { name: `压测班次_${Date.now()}`, startTime: '09:00', endTime: '18:00', color: '#1890ff' },
    });

    const start = Date.now();
    const response = await app.inject({
      method: 'POST',
      url: '/api/schedule/schedules',
      payload: { employeeId: emp.id, date: new Date().toISOString().split('T')[0], shiftTemplateId: template.id },
    });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    const body = JSON.parse(response.body);
    createdScheduleIds.push(body.data.id);
    console.log(`POST /api/schedule/schedules: ${duration}ms`);
  });

  // ─── 复杂查询测试 ───

  test('GET /api/workflow/templates - 审批流模板列表 ≤200ms', async () => {
    const start = Date.now();
    const response = await app.inject({ method: 'GET', url: '/api/workflow/templates?page=1&pageSize=20' });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /api/workflow/templates: ${duration}ms`);
  });

  test('GET /api/salary/structures - 薪资结构列表 ≤200ms', async () => {
    const start = Date.now();
    const response = await app.inject({ method: 'GET', url: '/api/salary/structures?page=1&pageSize=20' });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /api/salary/structures: ${duration}ms`);
  });
});