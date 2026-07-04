import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('Organization Routes - 部门', () => {
    let app;
    const createdDeptIds = [];
    afterEach(async () => {
        for (const id of createdDeptIds) {
            try {
                await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
            }
            catch { }
            try {
                await prisma.department.delete({ where: { id } });
            }
            catch { }
        }
        createdDeptIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('POST /api/org/departments - 创建顶级部门', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/departments',
            payload: {
                name: '技术部',
                sortOrder: 1,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('技术部');
        expect(body.data.parentId).toBeNull();
        expect(body.data.sortOrder).toBe(1);
        expect(typeof body.data.id).toBe('number');
        createdDeptIds.push(body.data.id);
    });
    it('POST /api/org/departments - 创建子部门', async () => {
        app = await buildTestApp();
        const parent = await prisma.department.create({
            data: { name: '技术部', sortOrder: 1 },
        });
        createdDeptIds.push(parent.id);
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/departments',
            payload: {
                name: '前端组',
                parentId: parent.id,
                sortOrder: 1,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('前端组');
        expect(body.data.parentId).toBe(parent.id);
        createdDeptIds.push(body.data.id);
    });
    it('POST /api/org/departments - 父部门不存在时返回错误', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/departments',
            payload: {
                name: '测试组',
                parentId: 99999,
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.code).not.toBe(0);
    });
    it('GET /api/org/departments - 分页查询部门列表', async () => {
        app = await buildTestApp();
        const d1 = await prisma.department.create({ data: { name: '技术部', sortOrder: 1 } });
        const d2 = await prisma.department.create({ data: { name: '产品部', sortOrder: 2 } });
        createdDeptIds.push(d1.id, d2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/org/departments?page=1&pageSize=10',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
        expect(body.data.total).toBeGreaterThanOrEqual(2);
    });
    it('GET /api/org/departments - 按 parentId 过滤', async () => {
        app = await buildTestApp();
        const parent = await prisma.department.create({ data: { name: '技术部', sortOrder: 1 } });
        const child = await prisma.department.create({
            data: { name: '前端组', parentId: parent.id, sortOrder: 1 },
        });
        createdDeptIds.push(parent.id, child.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/org/departments?page=1&pageSize=10&parentId=${parent.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.list.length).toBeGreaterThanOrEqual(1);
        expect(body.data.list[0].parentId).toBe(parent.id);
    });
    it('GET /api/org/departments - 按关键词搜索', async () => {
        app = await buildTestApp();
        const d1 = await prisma.department.create({ data: { name: '技术部', sortOrder: 1 } });
        const d2 = await prisma.department.create({ data: { name: '产品部', sortOrder: 2 } });
        createdDeptIds.push(d1.id, d2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/org/departments?page=1&pageSize=10&keyword=技术',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.list.length).toBeGreaterThanOrEqual(1);
        expect(body.data.list[0].name).toContain('技术');
    });
    it('GET /api/org/departments/:id - 根据ID获取部门', async () => {
        app = await buildTestApp();
        const dept = await prisma.department.create({ data: { name: '技术部', sortOrder: 1 } });
        createdDeptIds.push(dept.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/org/departments/${dept.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(dept.id);
        expect(body.data.name).toBe('技术部');
    });
    it('GET /api/org/departments/:id - 不存在的部门返回null', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'GET',
            url: '/api/org/departments/99999',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
    });
    it('PUT /api/org/departments/:id - 更新部门信息', async () => {
        app = await buildTestApp();
        const dept = await prisma.department.create({ data: { name: '技术部', sortOrder: 1 } });
        createdDeptIds.push(dept.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/org/departments/${dept.id}`,
            payload: {
                name: '研发部',
                sortOrder: 2,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('研发部');
        expect(body.data.sortOrder).toBe(2);
    });
    it('DELETE /api/org/departments/:id - 软删除部门', async () => {
        app = await buildTestApp();
        const dept = await prisma.department.create({ data: { name: '测试部', sortOrder: 1 } });
        createdDeptIds.push(dept.id);
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/org/departments/${dept.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
        const found = await prisma.department.findUnique({ where: { id: dept.id } });
        expect(found?.deletedAt).not.toBeNull();
    });
    it('GET /api/org/departments/tree - 获取部门树', async () => {
        app = await buildTestApp();
        const root = await prisma.department.create({ data: { name: '总公司', sortOrder: 0 } });
        const child1 = await prisma.department.create({
            data: { name: '技术部', parentId: root.id, sortOrder: 1 },
        });
        const child2 = await prisma.department.create({
            data: { name: '产品部', parentId: root.id, sortOrder: 2 },
        });
        const grandchild = await prisma.department.create({
            data: { name: '前端组', parentId: child1.id, sortOrder: 1 },
        });
        createdDeptIds.push(root.id, child1.id, child2.id, grandchild.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/org/departments/tree',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        const rootNode = body.data.find((n) => n.id === root.id);
        expect(rootNode).toBeDefined();
        expect(Array.isArray(rootNode.children)).toBe(true);
        expect(rootNode.children.length).toBeGreaterThanOrEqual(2);
        const techNode = rootNode.children.find((n) => n.id === child1.id);
        expect(techNode).toBeDefined();
        expect(techNode.children.length).toBeGreaterThanOrEqual(1);
    });
});
describe('Organization Routes - 职级', () => {
    let app;
    const createdRankIds = [];
    const uniqueLevel = () => Math.floor(1000 + Math.random() * 9000);
    afterEach(async () => {
        for (const id of createdRankIds) {
            if (!id)
                continue;
            try {
                await prisma.rank.delete({ where: { id } });
            }
            catch { }
        }
        createdRankIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('POST /api/org/ranks - 创建职级', async () => {
        app = await buildTestApp();
        const level = uniqueLevel();
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/ranks',
            payload: {
                name: 'P5',
                level,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('P5');
        expect(body.data.level).toBe(level);
        expect(typeof body.data.id).toBe('number');
        createdRankIds.push(body.data.id);
    });
    it('POST /api/org/ranks - level 重复返回错误', async () => {
        app = await buildTestApp();
        const level = uniqueLevel();
        const r = await prisma.rank.create({ data: { name: 'P5', level } });
        createdRankIds.push(r.id);
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/ranks',
            payload: {
                name: 'P6',
                level,
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.code).not.toBe(0);
    });
    it('GET /api/org/ranks - 查询职级列表', async () => {
        app = await buildTestApp();
        const r1 = await prisma.rank.create({ data: { name: 'P5', level: uniqueLevel() } });
        const r2 = await prisma.rank.create({ data: { name: 'P6', level: uniqueLevel() } });
        createdRankIds.push(r1.id, r2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/org/ranks',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(2);
    });
    it('GET /api/org/ranks/:id - 根据ID获取职级', async () => {
        app = await buildTestApp();
        const rank = await prisma.rank.create({ data: { name: 'P5', level: uniqueLevel() } });
        createdRankIds.push(rank.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/org/ranks/${rank.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(rank.id);
        expect(body.data.name).toBe('P5');
    });
    it('PUT /api/org/ranks/:id - 更新职级', async () => {
        app = await buildTestApp();
        const rank = await prisma.rank.create({ data: { name: 'P5', level: uniqueLevel() } });
        createdRankIds.push(rank.id);
        const newLevel = uniqueLevel();
        const response = await app.inject({
            method: 'PUT',
            url: `/api/org/ranks/${rank.id}`,
            payload: {
                name: '高级工程师',
                level: newLevel,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('高级工程师');
        expect(body.data.level).toBe(newLevel);
    });
    it('DELETE /api/org/ranks/:id - 删除职级', async () => {
        app = await buildTestApp();
        const rank = await prisma.rank.create({ data: { name: '临时职级', level: uniqueLevel() } });
        createdRankIds.push(rank.id);
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/org/ranks/${rank.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
        const found = await prisma.rank.findUnique({ where: { id: rank.id } });
        expect(found).toBeNull();
    });
});
describe('Organization Routes - 岗位', () => {
    let app;
    const createdPositionIds = [];
    const createdDeptIds = [];
    const createdRankIds = [];
    const setupTestData = async () => {
        const dept = await prisma.department.create({
            data: { name: `技术部_${Date.now()}`, sortOrder: 1 },
        });
        createdDeptIds.push(dept.id);
        const rank = await prisma.rank.create({
            data: { name: `P5_${Date.now()}`, level: Math.floor(2000 + Math.random() * 8000) },
        });
        createdRankIds.push(rank.id);
        return { dept, rank };
    };
    afterEach(async () => {
        for (const id of createdPositionIds) {
            try {
                await prisma.position.update({ where: { id }, data: { deletedAt: new Date() } });
            }
            catch { }
            try {
                await prisma.position.delete({ where: { id } });
            }
            catch { }
        }
        createdPositionIds.length = 0;
        for (const id of createdRankIds) {
            try {
                await prisma.rank.delete({ where: { id } });
            }
            catch { }
        }
        createdRankIds.length = 0;
        for (const id of createdDeptIds) {
            try {
                await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
            }
            catch { }
            try {
                await prisma.department.delete({ where: { id } });
            }
            catch { }
        }
        createdDeptIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('POST /api/org/positions - 创建岗位', async () => {
        app = await buildTestApp();
        const { dept, rank } = await setupTestData();
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/positions',
            payload: {
                name: '前端工程师',
                departmentId: dept.id,
                rankId: rank.id,
                headcount: 3,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('前端工程师');
        expect(body.data.departmentId).toBe(dept.id);
        expect(body.data.rankId).toBe(rank.id);
        expect(body.data.headcount).toBe(3);
        createdPositionIds.push(body.data.id);
    });
    it('POST /api/org/positions - 部门不存在返回错误', async () => {
        app = await buildTestApp();
        const { rank } = await setupTestData();
        const response = await app.inject({
            method: 'POST',
            url: '/api/org/positions',
            payload: {
                name: '前端工程师',
                departmentId: 99999,
                rankId: rank.id,
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.code).not.toBe(0);
    });
    it('GET /api/org/positions - 分页查询岗位列表', async () => {
        app = await buildTestApp();
        const { dept, rank } = await setupTestData();
        const p1 = await prisma.position.create({
            data: { name: '前端工程师', departmentId: dept.id, rankId: rank.id, headcount: 3 },
        });
        const p2 = await prisma.position.create({
            data: { name: '后端工程师', departmentId: dept.id, rankId: rank.id, headcount: 5 },
        });
        createdPositionIds.push(p1.id, p2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/org/positions?page=1&pageSize=10',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data.list)).toBe(true);
        expect(body.data.total).toBeGreaterThanOrEqual(2);
    });
    it('GET /api/org/positions - 按部门过滤', async () => {
        app = await buildTestApp();
        const { dept, rank } = await setupTestData();
        const p = await prisma.position.create({
            data: { name: '前端工程师', departmentId: dept.id, rankId: rank.id, headcount: 3 },
        });
        createdPositionIds.push(p.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/org/positions?page=1&pageSize=10&departmentId=${dept.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.list.length).toBeGreaterThanOrEqual(1);
        expect(body.data.list[0].departmentId).toBe(dept.id);
    });
    it('GET /api/org/positions/:id - 根据ID获取岗位', async () => {
        app = await buildTestApp();
        const { dept, rank } = await setupTestData();
        const pos = await prisma.position.create({
            data: { name: '前端工程师', departmentId: dept.id, rankId: rank.id, headcount: 3 },
        });
        createdPositionIds.push(pos.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/org/positions/${pos.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(pos.id);
        expect(body.data.name).toBe('前端工程师');
    });
    it('PUT /api/org/positions/:id - 更新岗位', async () => {
        app = await buildTestApp();
        const { dept, rank } = await setupTestData();
        const pos = await prisma.position.create({
            data: { name: '前端工程师', departmentId: dept.id, rankId: rank.id, headcount: 3 },
        });
        createdPositionIds.push(pos.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/org/positions/${pos.id}`,
            payload: {
                name: '高级前端工程师',
                headcount: 5,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('高级前端工程师');
        expect(body.data.headcount).toBe(5);
    });
    it('DELETE /api/org/positions/:id - 软删除岗位', async () => {
        app = await buildTestApp();
        const { dept, rank } = await setupTestData();
        const pos = await prisma.position.create({
            data: { name: '测试岗位', departmentId: dept.id, rankId: rank.id, headcount: 1 },
        });
        createdPositionIds.push(pos.id);
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/org/positions/${pos.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBeNull();
        const found = await prisma.position.findUnique({ where: { id: pos.id } });
        expect(found?.deletedAt).not.toBeNull();
    });
});
//# sourceMappingURL=org.route.test.js.map