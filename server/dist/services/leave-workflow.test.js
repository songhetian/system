import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { createLeaveRequest } from './leave-request.service.js';
import { approveWorkflowInstance, rejectWorkflowInstance } from './workflow.service.js';
describe('Leave Request + Workflow Integration - 请假审批流联动', () => {
    let employeeId;
    let userId;
    let templateId;
    let deptId;
    let rankId;
    let posId;
    beforeAll(async () => {
        // 建部门/岗位/员工
        const dept = await prisma.department.create({
            data: { name: `测试部门_${Date.now()}`, sortOrder: 1 },
        });
        deptId = dept.id;
        const rank = await prisma.rank.create({
            data: { name: `P_${Date.now()}`, level: 5000 },
        });
        rankId = rank.id;
        const pos = await prisma.position.create({
            data: { name: '测试岗位', departmentId: deptId, rankId, headcount: 5 },
        });
        posId = pos.id;
        const emp = await prisma.employee.create({
            data: {
                name: '请假测试员工',
                employeeNo: `LW${Date.now()}`.slice(-20),
                phone: '13800138000',
                idCard: '110101199001011234',
                hireDate: new Date('2024-01-01'),
                employeePositions: { create: { positionId: pos.id, startDate: new Date('2024-01-01') } },
            },
        });
        employeeId = emp.id;
        const user = await prisma.user.upsert({
            where: { id: 1 },
            create: { id: 1, username: 'test', passwordHash: 'x', employeeId },
            update: { employeeId },
        });
        userId = user.id;
        // 初始化额度
        const year = 2024;
        await prisma.leaveQuota.upsert({
            where: { employeeId_year: { employeeId, year } },
            create: { employeeId, year, annualBalance: 15, annualUsed: 0, sickUsed: 0, personalUsed: 0, compensatoryBalance: 0 },
            update: { annualBalance: 15, annualUsed: 0 },
        });
        // 创建请假审批模板（sourceType = 'LEAVE'）
        const template = await prisma.workflowTemplate.create({
            data: {
                name: '请假审批流程',
                description: '员工请假审批',
                sourceType: 'LEAVE',
                status: 'PUBLISHED',
                nodes: [
                    { id: 'start', type: 'START', label: '开始' },
                    { id: 'approve', type: 'APPROVAL', label: '审批', assigneeType: 'USER', assigneeId: employeeId, signType: 'OR' },
                    { id: 'end', type: 'END', label: '结束' },
                ],
                edges: [
                    { source: 'start', target: 'approve' },
                    { source: 'approve', target: 'end' },
                ],
            },
        });
        templateId = template.id;
    });
    afterAll(async () => {
        await prisma.workflowInstance.deleteMany({ where: { templateId } });
        await prisma.workflowTemplate.delete({ where: { id: templateId } }).catch(() => { });
        await prisma.leaveRequest.deleteMany({ where: { employeeId } });
        await prisma.leaveQuota.deleteMany({ where: { employeeId } });
        await prisma.employeePosition.deleteMany({ where: { employeeId } });
        await prisma.employee.delete({ where: { id: employeeId } }).catch(() => { });
        await prisma.position.delete({ where: { id: posId } }).catch(() => { });
        await prisma.rank.delete({ where: { id: rankId } }).catch(() => { });
        await prisma.department.delete({ where: { id: deptId } }).catch(() => { });
    });
    // ─── 创建请假自动启动审批流 ─────────────────────────────────
    it('创建请假申请时自动启动审批流', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-02',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '测试请假',
            attachments: [],
        });
        // 状态应该是 PENDING（待审批），不是直接 APPROVED
        expect(request.status).toBe('PENDING');
        // 应该有对应的审批流实例
        const instances = await prisma.workflowInstance.findMany({
            where: { sourceType: 'LEAVE', sourceId: request.id },
        });
        expect(instances.length).toBe(1);
        expect(instances[0].status).toBe('IN_PROGRESS');
        expect(instances[0].subject).toContain('请假申请');
    });
    // ─── 审批通过扣额度 ─────────────────────────────────
    it('审批通过后自动扣减假期额度', async () => {
        const beforeQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const beforeBalance = Number(beforeQuota?.annualBalance ?? 0);
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-07-01',
            endDate: '2024-07-02',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '审批通过测试',
            attachments: [],
        });
        const instance = await prisma.workflowInstance.findFirst({
            where: { sourceType: 'LEAVE', sourceId: request.id },
        });
        expect(instance).not.toBeNull();
        // 审批通过
        await approveWorkflowInstance(instance.id, '同意');
        // 请假状态应该变成 APPROVED
        const updatedRequest = await prisma.leaveRequest.findUnique({ where: { id: request.id } });
        expect(updatedRequest?.status).toBe('APPROVED');
        // 额度应该扣减 2 天
        const afterQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const afterBalance = Number(afterQuota?.annualBalance ?? 0);
        expect(beforeBalance - afterBalance).toBe(2);
    });
    // ─── 审批驳回不扣额度 ─────────────────────────────────
    it('审批驳回后不扣减假期额度', async () => {
        const beforeQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const beforeBalance = Number(beforeQuota?.annualBalance ?? 0);
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-08-01',
            endDate: '2024-08-02',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '审批驳回测试',
            attachments: [],
        });
        const instance = await prisma.workflowInstance.findFirst({
            where: { sourceType: 'LEAVE', sourceId: request.id },
        });
        // 审批驳回
        await rejectWorkflowInstance(instance.id, '驳回原因');
        // 请假状态应该变成 REJECTED
        const updatedRequest = await prisma.leaveRequest.findUnique({ where: { id: request.id } });
        expect(updatedRequest?.status).toBe('REJECTED');
        // 额度不变
        const afterQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const afterBalance = Number(afterQuota?.annualBalance ?? 0);
        expect(afterBalance).toBe(beforeBalance);
    });
});
//# sourceMappingURL=leave-workflow.test.js.map