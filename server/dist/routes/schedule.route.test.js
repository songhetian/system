import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('Schedule Routes - 班次模板', () => {
    let app;
    const createdIds = [];
    const createdNames = [];
    afterEach(async () => {
        for (const name of createdNames) {
            try {
                const t = await prisma.shiftTemplate.findUnique({ where: { name } });
                if (t) {
                    await prisma.schedule.deleteMany({ where: { shiftTemplateId: t.id } });
                    await prisma.shiftTemplate.delete({ where: { id: t.id } });
                }
            }
            catch { }
        }
        for (const id of createdIds) {
            try {
                await prisma.schedule.deleteMany({ where: { shiftTemplateId: id } });
                await prisma.shiftTemplate.delete({ where: { id } });
            }
            catch { }
        }
        createdIds.length = 0;
        createdNames.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('POST /api/schedule/shift-templates - 创建班次模板', async () => {
        app = await buildTestApp();
        const name = `早班_${Date.now()}`;
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/shift-templates',
            payload: {
                name,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
                description: '标准早班',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe(name);
        expect(body.data.startTime).toBe('08:00');
        expect(body.data.endTime).toBe('16:00');
        createdIds.push(body.data.id);
    });
    it('GET /api/schedule/shift-templates - 获取班次模板列表', async () => {
        app = await buildTestApp();
        const t1 = await prisma.shiftTemplate.create({
            data: {
                name: `早班_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        createdIds.push(t1.id);
        const t2 = await prisma.shiftTemplate.create({
            data: {
                name: `晚班_${Date.now()}`,
                startTime: '16:00',
                endTime: '00:00',
                color: '#3357FF',
            },
        });
        createdIds.push(t2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/schedule/shift-templates',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(2);
    });
    it('GET /api/schedule/shift-templates/:id - 根据ID获取班次模板', async () => {
        app = await buildTestApp();
        const t = await prisma.shiftTemplate.create({
            data: {
                name: `早班_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        createdIds.push(t.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/schedule/shift-templates/${t.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(t.id);
        expect(body.data.name).toBe(t.name);
    });
    it('PUT /api/schedule/shift-templates/:id - 更新班次模板', async () => {
        app = await buildTestApp();
        const t = await prisma.shiftTemplate.create({
            data: {
                name: `早班_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        createdIds.push(t.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/schedule/shift-templates/${t.id}`,
            payload: {
                name: '更新后的早班',
                color: '#00FF00',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('更新后的早班');
        expect(body.data.color).toBe('#00FF00');
    });
    it('DELETE /api/schedule/shift-templates/:id - 删除班次模板', async () => {
        app = await buildTestApp();
        const t = await prisma.shiftTemplate.create({
            data: {
                name: `待删除_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/schedule/shift-templates/${t.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBe(true);
    });
    it('POST /api/schedule/shift-templates - 名称重复返回错误', async () => {
        app = await buildTestApp();
        const name = `重复名称_${Date.now()}`;
        createdNames.push(name);
        await prisma.shiftTemplate.create({
            data: {
                name,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/shift-templates',
            payload: {
                name,
                startTime: '09:00',
                endTime: '17:00',
                color: '#00FF00',
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(Number(body.code)).toBe(30001);
    });
});
describe('Schedule Routes - 轮班规则', () => {
    let app;
    const createdShiftIds = [];
    const createdRuleIds = [];
    const createTestShiftTemplate = async (name) => {
        const t = await prisma.shiftTemplate.create({
            data: {
                name,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        createdShiftIds.push(t.id);
        return t;
    };
    afterEach(async () => {
        for (const id of createdRuleIds) {
            try {
                await prisma.rotationRule.delete({ where: { id } });
            }
            catch { }
        }
        for (const id of createdShiftIds) {
            try {
                await prisma.schedule.deleteMany({ where: { shiftTemplateId: id } });
                await prisma.shiftTemplate.delete({ where: { id } });
            }
            catch { }
        }
        createdShiftIds.length = 0;
        createdRuleIds.length = 0;
        if (app) {
            await app.close();
        }
    });
    it('POST /api/schedule/rotation-rules - 创建轮班规则', async () => {
        app = await buildTestApp();
        const shift = await createTestShiftTemplate(`早班_${Date.now()}`);
        const name = `三班倒_${Date.now()}`;
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/rotation-rules',
            payload: {
                name,
                cycleDays: 3,
                pattern: [
                    { dayOffset: 0, shiftTemplateId: shift.id },
                    { dayOffset: 1, shiftTemplateId: shift.id },
                    { dayOffset: 2, shiftTemplateId: shift.id },
                ],
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe(name);
        expect(body.data.cycleDays).toBe(3);
        expect(Array.isArray(body.data.pattern)).toBe(true);
        expect(body.data.pattern.length).toBe(3);
        createdRuleIds.push(body.data.id);
    });
    it('POST /api/schedule/rotation-rules - pattern 长度与 cycleDays 不一致返回错误', async () => {
        app = await buildTestApp();
        const shift = await createTestShiftTemplate(`早班_${Date.now()}`);
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/rotation-rules',
            payload: {
                name: `错误规则_${Date.now()}`,
                cycleDays: 3,
                pattern: [
                    { dayOffset: 0, shiftTemplateId: shift.id },
                    { dayOffset: 1, shiftTemplateId: shift.id },
                ],
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(Number(body.code)).toBe(10002);
    });
    it('GET /api/schedule/rotation-rules - 获取轮班规则列表', async () => {
        app = await buildTestApp();
        const shift = await createTestShiftTemplate(`早班_${Date.now()}`);
        const r1 = await prisma.rotationRule.create({
            data: {
                name: `规则1_${Date.now()}`,
                cycleDays: 3,
                pattern: [
                    { dayOffset: 0, shiftTemplateId: shift.id },
                    { dayOffset: 1, shiftTemplateId: shift.id },
                    { dayOffset: 2, shiftTemplateId: shift.id },
                ],
            },
        });
        createdRuleIds.push(r1.id);
        const r2 = await prisma.rotationRule.create({
            data: {
                name: `规则2_${Date.now()}`,
                cycleDays: 7,
                pattern: Array.from({ length: 7 }, (_, i) => ({
                    dayOffset: i,
                    shiftTemplateId: shift.id,
                })),
            },
        });
        createdRuleIds.push(r2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/schedule/rotation-rules',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(2);
    });
    it('GET /api/schedule/rotation-rules/:id - 根据ID获取轮班规则', async () => {
        app = await buildTestApp();
        const shift = await createTestShiftTemplate(`早班_${Date.now()}`);
        const r = await prisma.rotationRule.create({
            data: {
                name: `测试规则_${Date.now()}`,
                cycleDays: 3,
                pattern: [
                    { dayOffset: 0, shiftTemplateId: shift.id },
                    { dayOffset: 1, shiftTemplateId: shift.id },
                    { dayOffset: 2, shiftTemplateId: shift.id },
                ],
            },
        });
        createdRuleIds.push(r.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/schedule/rotation-rules/${r.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(r.id);
        expect(body.data.name).toBe(r.name);
    });
    it('PUT /api/schedule/rotation-rules/:id - 更新轮班规则', async () => {
        app = await buildTestApp();
        const shift = await createTestShiftTemplate(`早班_${Date.now()}`);
        const r = await prisma.rotationRule.create({
            data: {
                name: `旧规则_${Date.now()}`,
                cycleDays: 3,
                pattern: [
                    { dayOffset: 0, shiftTemplateId: shift.id },
                    { dayOffset: 1, shiftTemplateId: shift.id },
                    { dayOffset: 2, shiftTemplateId: shift.id },
                ],
            },
        });
        createdRuleIds.push(r.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/schedule/rotation-rules/${r.id}`,
            payload: {
                name: '更新后的规则',
                cycleDays: 2,
                pattern: [
                    { dayOffset: 0, shiftTemplateId: shift.id },
                    { dayOffset: 1, shiftTemplateId: shift.id },
                ],
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('更新后的规则');
        expect(body.data.cycleDays).toBe(2);
    });
    it('DELETE /api/schedule/rotation-rules/:id - 删除轮班规则', async () => {
        app = await buildTestApp();
        const shift = await createTestShiftTemplate(`早班_${Date.now()}`);
        const r = await prisma.rotationRule.create({
            data: {
                name: `待删除_${Date.now()}`,
                cycleDays: 1,
                pattern: [{ dayOffset: 0, shiftTemplateId: shift.id }],
            },
        });
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/schedule/rotation-rules/${r.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBe(true);
    });
});
describe('Schedule Routes - 排班记录', () => {
    let app;
    let testEmployeeId;
    let testShiftId;
    const createdScheduleIds = [];
    const createTestEmployee = async () => {
        const emp = await prisma.employee.create({
            data: {
                name: `测试员工_${Date.now()}`,
                employeeNo: `TEST_${Date.now()}`,
                phone: '13800138000',
                idCard: '110101199001011234',
                hireDate: new Date('2024-01-01'),
                status: 'ACTIVE',
            },
        });
        testEmployeeId = emp.id;
        return emp;
    };
    const createTestShiftTemplate = async () => {
        const shift = await prisma.shiftTemplate.create({
            data: {
                name: `早班_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        testShiftId = shift.id;
        return shift;
    };
    afterEach(async () => {
        for (const id of createdScheduleIds) {
            try {
                await prisma.schedule.delete({ where: { id } });
            }
            catch { }
        }
        createdScheduleIds.length = 0;
        if (testShiftId) {
            try {
                await prisma.schedule.deleteMany({ where: { shiftTemplateId: testShiftId } });
                await prisma.shiftTemplate.delete({ where: { id: testShiftId } });
            }
            catch { }
        }
        if (testEmployeeId) {
            try {
                await prisma.schedule.deleteMany({ where: { employeeId: testEmployeeId } });
                await prisma.employee.delete({ where: { id: testEmployeeId } });
            }
            catch { }
        }
        if (app) {
            await app.close();
        }
    });
    it('POST /api/schedule/schedules - 创建排班记录', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/schedules',
            payload: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: '2025-01-15',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.employeeId).toBe(testEmployeeId);
        expect(body.data.shiftTemplateId).toBe(testShiftId);
        createdScheduleIds.push(body.data.id);
    });
    it('POST /api/schedule/schedules - 同一天同一员工重复排班返回错误', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-15'),
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/schedules',
            payload: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: '2025-01-15',
            },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(Number(body.code)).toBe(30201);
    });
    it('GET /api/schedule/schedules - 查询排班记录', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const s1 = await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-15'),
            },
        });
        const s2 = await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-16'),
            },
        });
        createdScheduleIds.push(s1.id, s2.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/schedule/schedules?startDate=2025-01-01&endDate=2025-01-31',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(2);
    });
    it('GET /api/schedule/schedules - 按员工ID查询', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const s = await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-15'),
            },
        });
        createdScheduleIds.push(s.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/schedule/schedules?startDate=2025-01-01&endDate=2025-01-31&employeeId=${testEmployeeId}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.length).toBeGreaterThanOrEqual(1);
        expect(body.data[0].employeeId).toBe(testEmployeeId);
    });
    it('PUT /api/schedule/schedules/:id - 更新排班记录', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const shift2 = await prisma.shiftTemplate.create({
            data: {
                name: `晚班_${Date.now()}`,
                startTime: '16:00',
                endTime: '00:00',
                color: '#3333FF',
            },
        });
        const s = await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-15'),
            },
        });
        createdScheduleIds.push(s.id);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/schedule/schedules/${s.id}`,
            payload: {
                shiftTemplateId: shift2.id,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.shiftTemplateId).toBe(shift2.id);
    });
    it('DELETE /api/schedule/schedules/:id - 删除排班记录', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const s = await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-15'),
            },
        });
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/schedule/schedules/${s.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data).toBe(true);
    });
    it('GET /api/schedule/schedules/conflicts - 检测冲突（无冲突时返回空数组）', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const s = await prisma.schedule.create({
            data: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: new Date('2025-01-15'),
            },
        });
        createdScheduleIds.push(s.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/schedule/schedules/conflicts?startDate=2025-01-01&endDate=2025-01-31',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
    });
});
describe('Schedule Routes - 约束检查', () => {
    let app;
    let testEmployeeId;
    let testShiftId;
    const createTestEmployee = async () => {
        const emp = await prisma.employee.create({
            data: {
                name: `约束测试员工_${Date.now()}`,
                employeeNo: `CONST_${Date.now()}`,
                phone: '13800138001',
                idCard: '110101199002022345',
                hireDate: new Date('2024-01-01'),
                status: 'ACTIVE',
            },
        });
        testEmployeeId = emp.id;
        return emp;
    };
    const createTestShiftTemplate = async () => {
        const shift = await prisma.shiftTemplate.create({
            data: {
                name: `约束测试班次_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        testShiftId = shift.id;
        return shift;
    };
    afterEach(async () => {
        if (testShiftId) {
            try {
                await prisma.schedule.deleteMany({ where: { shiftTemplateId: testShiftId } });
                await prisma.shiftTemplate.delete({ where: { id: testShiftId } });
            }
            catch { }
        }
        if (testEmployeeId) {
            try {
                await prisma.schedule.deleteMany({ where: { employeeId: testEmployeeId } });
                await prisma.employee.delete({ where: { id: testEmployeeId } });
            }
            catch { }
        }
        if (app) {
            await app.close();
        }
    });
    it('POST /api/schedule/constraints/check - 单条约束检查', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/constraints/check',
            payload: {
                employeeId: testEmployeeId,
                shiftTemplateId: testShiftId,
                date: '2025-03-15',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
    });
    it('POST /api/schedule/constraints/batch-check - 批量约束检查', async () => {
        app = await buildTestApp();
        await createTestEmployee();
        await createTestShiftTemplate();
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/constraints/batch-check',
            payload: {
                schedules: [
                    { employeeId: testEmployeeId, shiftTemplateId: testShiftId, date: '2025-03-15' },
                    { employeeId: testEmployeeId, shiftTemplateId: testShiftId, date: '2025-03-16' },
                ],
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(typeof body.data).toBe('object');
    });
});
describe('Schedule Routes - 排班模板', () => {
    let app;
    let testEmployeeId;
    let testShiftId;
    const createdTemplateIds = [];
    const createTestEmployee = async () => {
        const emp = await prisma.employee.create({
            data: {
                name: `模板测试员工_${Date.now()}`,
                employeeNo: `TMPL_${Date.now()}`,
                phone: '13800138002',
                idCard: '110101199003033456',
                hireDate: new Date('2024-01-01'),
                status: 'ACTIVE',
            },
        });
        testEmployeeId = emp.id;
        return emp;
    };
    const createTestShiftTemplate = async () => {
        const shift = await prisma.shiftTemplate.create({
            data: {
                name: `模板测试班次_${Date.now()}`,
                startTime: '08:00',
                endTime: '16:00',
                color: '#FF5733',
            },
        });
        testShiftId = shift.id;
        return shift;
    };
    afterEach(async () => {
        for (const id of createdTemplateIds) {
            try {
                await prisma.scheduleTemplate.delete({ where: { id } });
            }
            catch { }
        }
        createdTemplateIds.length = 0;
        if (testShiftId) {
            try {
                await prisma.schedule.deleteMany({ where: { shiftTemplateId: testShiftId } });
                await prisma.shiftTemplate.delete({ where: { id: testShiftId } });
            }
            catch { }
        }
        if (testEmployeeId) {
            try {
                await prisma.schedule.deleteMany({ where: { employeeId: testEmployeeId } });
                await prisma.employee.delete({ where: { id: testEmployeeId } });
            }
            catch { }
        }
        if (app) {
            await app.close();
        }
    });
    it('POST /api/schedule/templates - 从历史创建模板', async () => {
        app = await buildTestApp();
        const emp = await createTestEmployee();
        const shift = await createTestShiftTemplate();
        // 先创建排班记录作为历史数据
        const s1 = await prisma.schedule.create({
            data: {
                employeeId: emp.id,
                shiftTemplateId: shift.id,
                date: new Date('2025-06-01'),
            },
        });
        const s2 = await prisma.schedule.create({
            data: {
                employeeId: emp.id,
                shiftTemplateId: shift.id,
                date: new Date('2025-06-02'),
            },
        });
        const response = await app.inject({
            method: 'POST',
            url: '/api/schedule/templates',
            payload: {
                name: `测试模板_${Date.now()}`,
                sourceStartDate: '2025-06-01',
                sourceEndDate: '2025-06-02',
                sourceEmployees: [emp.id],
                creatorId: 1,
                creatorName: 'testuser',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBeDefined();
        expect(body.data.pattern).toBeDefined();
        expect(body.data.totalDays).toBe(2);
        createdTemplateIds.push(body.data.id);
        // 清理排班记录
        await prisma.schedule.deleteMany({ where: { id: { in: [s1.id, s2.id] } } });
    });
    it('GET /api/schedule/templates - 模板列表', async () => {
        app = await buildTestApp();
        const tpl = await prisma.scheduleTemplate.create({
            data: {
                name: `列表模板_${Date.now()}`,
                pattern: [{ dayOffset: 0, shiftTemplateId: 1 }],
                sourceStartDate: new Date('2025-06-01'),
                sourceEndDate: new Date('2025-06-01'),
                totalDays: 1,
                createdFrom: 'HISTORY',
                creatorId: 1,
                creatorName: 'testuser',
            },
        });
        createdTemplateIds.push(tpl.id);
        const response = await app.inject({
            method: 'GET',
            url: '/api/schedule/templates',
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.list).toBeDefined();
        expect(body.data.total).toBeGreaterThanOrEqual(1);
    });
    it('GET /api/schedule/templates/:id - 模板详情', async () => {
        app = await buildTestApp();
        const tpl = await prisma.scheduleTemplate.create({
            data: {
                name: `详情模板_${Date.now()}`,
                pattern: [{ dayOffset: 0, shiftTemplateId: 1 }],
                sourceStartDate: new Date('2025-06-01'),
                sourceEndDate: new Date('2025-06-01'),
                totalDays: 1,
                createdFrom: 'HISTORY',
                creatorId: 1,
                creatorName: 'testuser',
            },
        });
        createdTemplateIds.push(tpl.id);
        const response = await app.inject({
            method: 'GET',
            url: `/api/schedule/templates/${tpl.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.id).toBe(tpl.id);
        expect(body.data.name).toBe(tpl.name);
    });
    it('DELETE /api/schedule/templates/:id - 删除模板', async () => {
        app = await buildTestApp();
        const tpl = await prisma.scheduleTemplate.create({
            data: {
                name: `删除模板_${Date.now()}`,
                pattern: [{ dayOffset: 0, shiftTemplateId: 1 }],
                sourceStartDate: new Date('2025-06-01'),
                sourceEndDate: new Date('2025-06-01'),
                totalDays: 1,
                createdFrom: 'HISTORY',
                creatorId: 1,
                creatorName: 'testuser',
            },
        });
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/schedule/templates/${tpl.id}`,
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
    });
    it('POST /api/schedule/templates/:id/apply - 应用模板', async () => {
        app = await buildTestApp();
        const emp = await createTestEmployee();
        const shift = await createTestShiftTemplate();
        const tpl = await prisma.scheduleTemplate.create({
            data: {
                name: `应用模板_${Date.now()}`,
                pattern: [{ dayOffset: 0, shiftTemplateId: shift.id }],
                sourceStartDate: new Date('2025-06-01'),
                sourceEndDate: new Date('2025-06-01'),
                totalDays: 1,
                createdFrom: 'HISTORY',
                creatorId: 1,
                creatorName: 'testuser',
            },
        });
        createdTemplateIds.push(tpl.id);
        const response = await app.inject({
            method: 'POST',
            url: `/api/schedule/templates/${tpl.id}/apply`,
            payload: {
                employeeIds: [emp.id],
                startDate: '2025-07-01',
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.created).toBeGreaterThanOrEqual(0);
        expect(typeof body.data.skipped).toBe('number');
    });
});
//# sourceMappingURL=schedule.route.test.js.map