import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';
describe('Phase 5 Routes - Expense', () => {
    let app;
    const createdClaimIds = [];
    const createdEmployeeIds = [];
    afterEach(async () => {
        for (const id of createdClaimIds) {
            try {
                await prisma.expenseClaim.delete({ where: { id } });
            }
            catch { }
        }
        createdClaimIds.length = 0;
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
    async function createTestEmployee() {
        const emp = await prisma.employee.create({
            data: { name: '测试员工', employeeNo: `EMP_${Date.now()}`, phone: '13800138000', idCard: '110101199001011234', hireDate: new Date('2024-01-01') },
        });
        createdEmployeeIds.push(emp.id);
        return emp;
    }
    it('POST /api/expense/claims - 创建报销单', async () => {
        const emp = await createTestEmployee();
        app = await buildTestApp({ employeeId: emp.id });
        const response = await app.inject({
            method: 'POST',
            url: '/api/expense/claims',
            payload: { title: '差旅报销', expenseType: 'TRAVEL', amount: 1500 },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.status).toBe('DRAFT');
        createdClaimIds.push(body.data.id);
    });
    it('POST /api/expense/claims/:id/submit - 提交报销单', async () => {
        const emp = await createTestEmployee();
        app = await buildTestApp();
        const claim = await prisma.expenseClaim.create({
            data: { employeeId: emp.id, title: '测试', expenseType: 'TRAVEL', amount: 100 },
        });
        createdClaimIds.push(claim.id);
        const response = await app.inject({ method: 'POST', url: `/api/expense/claims/${claim.id}/submit` });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.status).toBe('PENDING');
    });
    it('POST /api/expense/claims/:id/approve - 审批通过', async () => {
        const emp = await createTestEmployee();
        app = await buildTestApp();
        const claim = await prisma.expenseClaim.create({
            data: { employeeId: emp.id, title: '测试', expenseType: 'TRAVEL', amount: 100, status: 'PENDING' },
        });
        createdClaimIds.push(claim.id);
        const response = await app.inject({ method: 'POST', url: `/api/expense/claims/${claim.id}/approve` });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.status).toBe('APPROVED');
    });
    it('POST /api/expense/claims/:id/reject - 审批驳回', async () => {
        const emp = await createTestEmployee();
        app = await buildTestApp();
        const claim = await prisma.expenseClaim.create({
            data: { employeeId: emp.id, title: '测试', expenseType: 'TRAVEL', amount: 100, status: 'PENDING' },
        });
        createdClaimIds.push(claim.id);
        const response = await app.inject({ method: 'POST', url: `/api/expense/claims/${claim.id}/reject` });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.status).toBe('REJECTED');
    });
    it('GET /api/expense/claims - 查询报销单列表', async () => {
        const emp = await createTestEmployee();
        app = await buildTestApp();
        const claim = await prisma.expenseClaim.create({
            data: { employeeId: emp.id, title: '列表测试', expenseType: 'OFFICE', amount: 200 },
        });
        createdClaimIds.push(claim.id);
        const response = await app.inject({ method: 'GET', url: '/api/expense/claims?page=1&pageSize=10' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.total).toBeGreaterThanOrEqual(1);
    });
});
describe('Phase 5 Routes - Training', () => {
    let app;
    const createdCourseIds = [];
    const createdEnrollmentIds = [];
    const createdEmployeeIds = [];
    afterEach(async () => {
        for (const id of createdEnrollmentIds) {
            try {
                await prisma.trainingEnrollment.delete({ where: { id } });
            }
            catch { }
        }
        createdEnrollmentIds.length = 0;
        for (const id of createdCourseIds) {
            try {
                await prisma.trainingCourse.delete({ where: { id } });
            }
            catch { }
        }
        createdCourseIds.length = 0;
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
    async function createTestEmployee() {
        const emp = await prisma.employee.create({
            data: { name: '培训员工', employeeNo: `TR_${Date.now()}`, phone: '13800138000', idCard: '110101199001011234', hireDate: new Date('2024-01-01') },
        });
        createdEmployeeIds.push(emp.id);
        return emp;
    }
    it('POST /api/training/courses - 创建培训课程', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/training/courses',
            payload: { name: '新员工培训', type: 'OFFLINE', startDate: '2025-02-01', endDate: '2025-02-15' },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.name).toBe('新员工培训');
        createdCourseIds.push(body.data.id);
    });
    it('POST /api/training/courses/:id/enroll - 报名培训', async () => {
        app = await buildTestApp();
        const course = await prisma.trainingCourse.create({
            data: { name: '报名测试', type: 'ONLINE', startDate: new Date('2025-02-01'), endDate: new Date('2025-02-15') },
        });
        createdCourseIds.push(course.id);
        const emp = await createTestEmployee();
        const response = await app.inject({
            method: 'POST',
            url: `/api/training/courses/${course.id}/enroll`,
            payload: { employeeIds: [emp.id] },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.count).toBe(1);
    });
    it('POST /api/training/courses/:id/complete - 完成培训', async () => {
        app = await buildTestApp();
        const course = await prisma.trainingCourse.create({
            data: { name: '完成测试', type: 'ONLINE', startDate: new Date('2025-02-01'), endDate: new Date('2025-02-15') },
        });
        createdCourseIds.push(course.id);
        const emp = await createTestEmployee();
        const enrollment = await prisma.trainingEnrollment.create({
            data: { courseId: course.id, employeeId: emp.id },
        });
        createdEnrollmentIds.push(enrollment.id);
        const response = await app.inject({
            method: 'POST',
            url: `/api/training/courses/${course.id}/complete`,
            payload: { employeeId: emp.id, score: 90 },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.score).toBe(90);
        expect(body.data.completedAt).not.toBeNull();
    });
    it('GET /api/training/records - 查询培训记录', async () => {
        app = await buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/training/records' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(Array.isArray(body.data)).toBe(true);
    });
});
describe('Phase 5 Routes - KB', () => {
    let app;
    const createdDocIds = [];
    afterEach(async () => {
        for (const id of createdDocIds) {
            try {
                await prisma.kbDocument.delete({ where: { id } });
            }
            catch { }
        }
        createdDocIds.length = 0;
        if (app)
            await app.close();
    });
    it('POST /api/kb/documents - 创建知识库文档', async () => {
        app = await buildTestApp();
        const response = await app.inject({
            method: 'POST',
            url: '/api/kb/documents',
            payload: { title: '公司制度', category: 'POLICY' },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.title).toBe('公司制度');
        expect(body.data.category).toBe('POLICY');
        createdDocIds.push(body.data.id);
    });
    it('GET /api/kb/documents - 查询文档列表', async () => {
        app = await buildTestApp();
        const doc = await prisma.kbDocument.create({
            data: { title: '列表文档', category: 'FORM', fileName: 'test.pdf', fileSize: 1024, fileUrl: '/test', uploaderId: 1, uploaderName: 'admin' },
        });
        createdDocIds.push(doc.id);
        const response = await app.inject({ method: 'GET', url: '/api/kb/documents?page=1&pageSize=10' });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.total).toBeGreaterThanOrEqual(1);
    });
    it('GET /api/kb/documents/:id/preview - 获取预览链接', async () => {
        app = await buildTestApp();
        const doc = await prisma.kbDocument.create({
            data: { title: '预览文档', category: 'POLICY', fileName: 'preview.pdf', fileSize: 2048, fileUrl: '/preview-url', uploaderId: 1, uploaderName: 'admin' },
        });
        createdDocIds.push(doc.id);
        const response = await app.inject({ method: 'GET', url: `/api/kb/documents/${doc.id}/preview` });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.code).toBe(0);
        expect(body.data.url).toBeDefined();
        expect(typeof body.data.url).toBe('string');
        expect(body.data.url.length).toBeGreaterThan(0);
        expect(body.data.expiresAt).toBeDefined();
    });
});
//# sourceMappingURL=phase5.route.test.js.map