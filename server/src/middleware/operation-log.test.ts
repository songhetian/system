import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('Operation Log Middleware', () => {
  let app: FastifyInstance;
  const createdDeptIds: number[] = [];

  afterEach(async () => {
    for (const id of createdDeptIds) {
      try { await prisma.department.delete({ where: { id } }); } catch {}
    }
    createdDeptIds.length = 0;
    if (app) await app.close();
  });

  it('创建部门时自动写入操作日志', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/org/departments',
      payload: { name: `审计测试部门_${Date.now()}`, sortOrder: 99 },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    createdDeptIds.push(body.data.id);

    // 验证操作日志已写入
    const logs = await prisma.operationLog.findMany({
      where: { entityType: 'Department', entityId: body.data.id },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].action).toBe('CREATE');
    expect(logs[0].username).toBe('testuser');
  });

  it('更新部门时记录 before/after', async () => {
    app = await buildTestApp();

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/org/departments',
      payload: { name: `更新前部门_${Date.now()}`, sortOrder: 0 },
    });
    const deptId = JSON.parse(createRes.body).data.id;
    createdDeptIds.push(deptId);

    await app.inject({
      method: 'PUT',
      url: `/api/org/departments/${deptId}`,
      payload: { name: `更新后部门_${Date.now()}` },
    });

    const logs = await prisma.operationLog.findMany({
      where: { entityType: 'Department', entityId: deptId },
      orderBy: { id: 'asc' },
    });

    const updateLog = logs.find((l) => l.action === 'UPDATE');
    expect(updateLog).toBeDefined();
    expect(updateLog!.before).toBeDefined();
    expect(updateLog!.after).toBeDefined();
  });

  it('软删除部门时记录 UPDATE 操作日志', async () => {
    app = await buildTestApp();

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/org/departments',
      payload: { name: `待删除部门_${Date.now()}`, sortOrder: 0 },
    });
    const deptId = JSON.parse(createRes.body).data.id;

    await app.inject({
      method: 'DELETE',
      url: `/api/org/departments/${deptId}`,
    });

    const logs = await prisma.operationLog.findMany({
      where: { entityType: 'Department', entityId: deptId },
      orderBy: { id: 'asc' },
    });

    // CREATE + UPDATE（软删除是 UPDATE）
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.some((l) => l.action === 'CREATE')).toBe(true);
    expect(logs.some((l) => l.action === 'UPDATE')).toBe(true);
  });
});
