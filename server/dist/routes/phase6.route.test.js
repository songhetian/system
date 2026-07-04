import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('Phase 6 Routes - Excel', () => {
    let app;
    const createdTaskIds = [];
    const createdEmployeeIds = [];
    afterEach(async () => {
        for (const id of createdTaskIds) {
            try {
                await prisma.excelTask.delete({ where: { id } });
            }
            catch { }
        }
        createdTaskIds.length = 0;
        for (const id of createdEmployeeIds) {
            try {
                await prisma.employee.delete({ where: { id } });
            }
            catch { }
        }
        createdEmployeeIds.length = 0;
        if (app)
            await app.close();
    });
    it('POST /api/excel/import/employee - 接口连通性验证', async () => {
        app = await buildTestApp();
        // ponytail: multipart 上传测试需要特殊配置，此处验证路由注册正确
        const response = await app.inject({
            method: 'POST',
            url: '/api/excel/import/employee',
        });
        // 期望 415 或 400 均表示路由已注册
        expect([400, 415]).toContain(response.statusCode);
    });
    it('GET /api/excel/tasks - 查询任务列表', async () => {
        app = await buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/excel/tasks' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
    });
});
describe('Phase 6 Routes - Message', () => {
    let app;
    const createdMessageIds = [];
    const createdUserIds = [];
    afterEach(async () => {
        for (const id of createdMessageIds) {
            try {
                await prisma.message.delete({ where: { id } });
            }
            catch { }
        }
        createdMessageIds.length = 0;
        for (const id of createdUserIds) {
            try {
                await prisma.user.delete({ where: { id } });
            }
            catch { }
        }
        createdUserIds.length = 0;
        if (app)
            await app.close();
    });
    it('GET /api/messages - 查询消息列表', async () => {
        app = await buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/messages?page=1&pageSize=10' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
    });
    it('GET /api/messages/unread-count - 查询未读消息数', async () => {
        app = await buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/messages/unread-count' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.count).toBeGreaterThanOrEqual(0);
    });
    it('POST /api/messages/read-all - 全部标记已读', async () => {
        app = await buildTestApp();
        const response = await app.inject({ method: 'POST', url: '/api/messages/read-all' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.count).toBeGreaterThanOrEqual(0);
    });
});
describe('Phase 6 Routes - Announcement', () => {
    let app;
    const createdAnnouncementIds = [];
    afterEach(async () => {
        for (const id of createdAnnouncementIds) {
            try {
                await prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } });
            }
            catch { }
        }
        createdAnnouncementIds.length = 0;
        if (app)
            await app.close();
    });
    it('POST /api/announcements - 创建公告', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/announcements',
            payload: { title: '测试公告', content: '公告内容', targetType: 'ALL', targetIds: [] },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.title).toBe('测试公告');
        expect(body.data.status).toBe('DRAFT');
        createdAnnouncementIds.push(body.data.id);
    });
    it('GET /api/announcements - 查询公告列表', async () => {
        app = await buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/announcements?page=1&pageSize=10' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
    });
    it('POST /api/announcements/:id/publish - 发布公告', async () => {
        app = await buildTestApp();
        const ann = await prisma.announcement.create({
            data: { title: '发布测试', content: '内容', targetType: 'ALL', targetIds: [], attachments: [], publisherId: 1, publisherName: 'admin' },
        });
        createdAnnouncementIds.push(ann.id);
        const response = await app.inject({ method: 'POST', url: `/api/announcements/${ann.id}/publish` });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.status).toBe('PUBLISHED');
        expect(body.data.publishedAt).not.toBeNull();
    });
});
//# sourceMappingURL=phase6.route.test.js.map