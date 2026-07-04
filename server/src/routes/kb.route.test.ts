import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('KB File Security Routes', () => {
  let app: FastifyInstance;
  const createdDocIds: number[] = [];
  const createdUserIds: number[] = [];

  afterEach(async () => {
    for (const id of createdDocIds) {
      try { await prisma.kbDocument.delete({ where: { id } }); } catch {}
    }
    createdDocIds.length = 0;
    for (const id of createdUserIds) {
      try { await prisma.user.delete({ where: { id } }); } catch {}
    }
    createdUserIds.length = 0;
    if (app) await app.close();
  });

  async function createTestUser() {
    // ponytail: 创建真实用户以满足 KbDocument 外键约束
    const user = await prisma.user.create({
      data: { username: `sec_test_${Date.now()}`, passwordHash: 'hash' },
    });
    createdUserIds.push(user.id);
    return user;
  }

  it('POST /api/kb/documents/:id/security - 更新文件安全等级', async () => {
    const user = await createTestUser();
    app = await buildTestApp({ employeeId: 1 });
    const doc = await prisma.kbDocument.create({
      data: {
        title: '安全测试文档',
        category: 'POLICY',
        fileName: 'sec.pdf',
        fileSize: 1024,
        fileUrl: '/sec',
        uploaderId: user.id,
        uploaderName: 'admin',
      },
    });
    createdDocIds.push(doc.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/kb/documents/${doc.id}/security`,
      payload: {
        securityLevel: 'SENSITIVE',
        allowedUserIds: [user.id],
        allowedRoleIds: [],
      },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.securityLevel).toBe('SENSITIVE');
  });

  it('POST /api/kb/documents/:id/check-access - 检查文件访问权限', async () => {
    const doc = await prisma.kbDocument.create({
      data: {
        title: '权限测试文档',
        category: 'FORM',
        fileName: 'access.pdf',
        fileSize: 2048,
        fileUrl: '/access',
        uploaderId: 1,
        uploaderName: 'admin',
        securityLevel: 'PUBLIC',
      },
    });
    createdDocIds.push(doc.id);

    app = await buildTestApp();
    const response = await app.inject({
      method: 'POST',
      url: `/api/kb/documents/${doc.id}/check-access`,
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.allowed).toBe(true);
  });

  it('GET /api/kb/security-levels - 获取安全等级列表', async () => {
    app = await buildTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/kb/security-levels',
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(4);
    expect(body.data[0].value).toBe('PUBLIC');
    expect(body.data[3].value).toBe('CONFIDENTIAL');
  });
});
