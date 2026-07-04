import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';

describe('Salary Password Routes - 二级密码', () => {
  let app: FastifyInstance;
  let testUserId: number;
  let testEmployeeId: number;
  let accessToken: string;
  const TEST_USER_PASSWORD = 'Test123456';
  const TEST_SALARY_PASSWORD = 'Salary123';

  const createTestEmployee = async () => {
    const emp = await prisma.employee.create({
      data: {
        name: `测试员工_SAL_${Date.now()}`,
        employeeNo: `TEST_SAL_${Date.now()}`,
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
    const passwordHash = await hashPassword(TEST_USER_PASSWORD);
    const user = await prisma.user.create({
      data: {
        username: `testuser_sal_${Date.now()}`,
        passwordHash,
        employeeId: testEmployeeId,
      },
    });
    testUserId = user.id;
    return user;
  };

  const generateAccessToken = async (app: FastifyInstance, userId: number, username: string) => {
    return app.jwt.sign(
      { id: userId, username, employeeId: testEmployeeId },
      { expiresIn: '15m' },
    );
  };

  afterEach(async () => {
    if (testUserId) {
      try { await prisma.salaryPassword.deleteMany({ where: { userId: testUserId } }); } catch {}
      try { await prisma.salaryAuditLog.deleteMany({ where: { userId: testUserId } }); } catch {}
      try { await prisma.userRoles.deleteMany({ where: { userId: testUserId } }); } catch {}
      try { await prisma.user.delete({ where: { id: testUserId } }); } catch {}
    }
    if (testEmployeeId) {
      try { await prisma.employee.delete({ where: { id: testEmployeeId } }); } catch {}
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /api/salary-password/set - 首次设置二级密码', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/set',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        newPassword: TEST_SALARY_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();

    const record = await prisma.salaryPassword.findUnique({ where: { userId: testUserId } });
    expect(record).not.toBeNull();
  });

  it('POST /api/salary-password/set - 修改二级密码需要旧密码', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const passwordHash = await hashPassword(TEST_SALARY_PASSWORD);
    await prisma.salaryPassword.create({
      data: { userId: testUserId, passwordHash },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/set',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        newPassword: 'NewSalary123',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(21003);
  });

  it('POST /api/salary-password/set - 修改二级密码（旧密码正确）', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const passwordHash = await hashPassword(TEST_SALARY_PASSWORD);
    await prisma.salaryPassword.create({
      data: { userId: testUserId, passwordHash },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/set',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        oldPassword: TEST_SALARY_PASSWORD,
        newPassword: 'NewSalary123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
  });

  it('POST /api/salary-password/set - 修改二级密码（旧密码错误）', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const passwordHash = await hashPassword(TEST_SALARY_PASSWORD);
    await prisma.salaryPassword.create({
      data: { userId: testUserId, passwordHash },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/set',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        oldPassword: 'WrongPassword',
        newPassword: 'NewSalary123',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(21004);
  });

  it('POST /api/salary-password/verify - 未设置二级密码时验证失败', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/verify',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        password: TEST_SALARY_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(21001);
  });

  it('POST /api/salary-password/verify - 二级密码验证成功', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const passwordHash = await hashPassword(TEST_SALARY_PASSWORD);
    await prisma.salaryPassword.create({
      data: { userId: testUserId, passwordHash },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/verify',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        password: TEST_SALARY_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(typeof body.data.token).toBe('string');
    expect(typeof body.data.expiresIn).toBe('number');
    expect(body.data.expiresIn).toBeGreaterThan(0);
  });

  it('POST /api/salary-password/verify - 二级密码验证失败', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const passwordHash = await hashPassword(TEST_SALARY_PASSWORD);
    await prisma.salaryPassword.create({
      data: { userId: testUserId, passwordHash },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/verify',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        password: 'WrongPassword',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(21000);
  });

  it('POST /api/salary-password/verify - 连续失败3次后锁定', async () => {
    app = await buildTestApp({ skipAuth: false });
    await createTestEmployee();
    const user = await createTestUser();
    accessToken = await generateAccessToken(app, user.id, user.username);

    const passwordHash = await hashPassword(TEST_SALARY_PASSWORD);
    await prisma.salaryPassword.create({
      data: { userId: testUserId, passwordHash },
    });

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/salary-password/verify',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          password: 'WrongPassword',
        },
      });
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/salary-password/verify',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        password: TEST_SALARY_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(423);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(21002);
  });
});
