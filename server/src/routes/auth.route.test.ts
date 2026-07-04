import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';

describe('Auth Routes - 认证', () => {
  let app: FastifyInstance;
  let testUserId: number;
  let testEmployeeId: number;
  const TEST_PASSWORD = 'Test123456';

  const createTestEmployee = async () => {
    const emp = await prisma.employee.create({
      data: {
        name: `测试员工_AUTH_${Date.now()}`,
        employeeNo: `TEST_AUTH_${Date.now()}`,
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
        status: 'ACTIVE',
      },
    });
    testEmployeeId = emp.id;
    return emp;
  };

  const createTestUser = async () => {
    const passwordHash = await hashPassword(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: {
        username: `testuser_${Date.now()}`,
        passwordHash,
        employeeId: testEmployeeId,
      },
    });
    testUserId = user.id;
    return user;
  };

  afterEach(async () => {
    if (testUserId) {
      try { await prisma.user.delete({ where: { id: testUserId } }); } catch {}
    }
    if (testEmployeeId) {
      try { await prisma.employee.delete({ where: { id: testEmployeeId } }); } catch {}
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /api/auth/login - 成功登录', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: user.username,
        password: TEST_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(typeof body.data.accessToken).toBe('string');
    expect(body.data.user.id).toBe(user.id);
    expect(body.data.user.username).toBe(user.username);
    expect(body.data.user.employeeId).toBe(testEmployeeId);

    const cookies = response.cookies;
    const refreshCookie = cookies.find((c: any) => c.name === 'X-Refresh-Token');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie.httpOnly).toBe(true);
  });

  it('POST /api/auth/login - 用户名不存在返回401', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'nonexistent',
        password: TEST_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20000);
    expect(body.data).toBeNull();
  });

  it('POST /api/auth/login - 密码错误返回401', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: user.username,
        password: 'WrongPassword',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20000);
  });

  it('POST /api/auth/login - 连续失败5次后账户锁定', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    const user = await createTestUser();

    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: user.username,
          password: 'WrongPassword',
        },
      });
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: user.username,
        password: TEST_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(423);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20002);
  });

  it('POST /api/auth/refresh - 无 refresh token 返回401', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20000);
  });

  it('POST /api/auth/refresh - 使用有效 refresh token 获取新 access token', async () => {
    app = await buildTestApp();
    await createTestEmployee();
    const user = await createTestUser();

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: user.username,
        password: TEST_PASSWORD,
      },
    });

    const refreshCookie = loginResponse.cookies.find((c: any) => c.name === 'X-Refresh-Token');
    expect(refreshCookie).toBeDefined();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: {
        'X-Refresh-Token': refreshCookie.value,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(typeof body.data.accessToken).toBe('string');
  });

  it('POST /api/auth/refresh - 无效 refresh token 返回401', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: {
        'X-Refresh-Token': 'invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(20000);
  });

  it('POST /api/auth/logout - 登出成功', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();
  });
});
