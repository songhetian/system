import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { initLeaveQuota } from './leave-quota.service.js';
import { createLeaveRequest, findLeaveRequestByFilter, updateLeaveRequest, approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest, LeaveRequestError, } from './leave-request.service.js';
function generateUniqueNo() {
    return `TEST${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
}
describe('LeaveRequestService', () => {
    let employeeId;
    beforeEach(async () => {
        const employee = await prisma.employee.create({
            data: {
                name: '测试员工',
                employeeNo: generateUniqueNo(),
                phone: '13800138001',
                idCard: `11010119900101${Math.random().toString(10).substr(2, 4)}`,
                hireDate: new Date('2020-01-01'),
                status: 'ACTIVE',
            },
        });
        employeeId = employee.id;
        await initLeaveQuota(2024, [employeeId]);
    });
    afterEach(async () => {
        await prisma.leaveRequest.deleteMany({
            where: { employeeId },
        });
        await prisma.leaveQuota.deleteMany({
            where: { employeeId },
        });
        await prisma.employee.delete({
            where: { id: employeeId },
        }).catch(() => { });
    });
    it('创建请假申请成功', async () => {
        const result = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        expect(result).toBeDefined();
        expect(result.status).toBe('PENDING');
        expect(result.type).toBe('ANNUAL');
    });
    it('创建请假申请余额不足失败', async () => {
        await expect(createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-20',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        })).rejects.toThrow(LeaveRequestError);
    });
    it('查询请假申请列表', async () => {
        await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        const result = await findLeaveRequestByFilter({ employeeId });
        expect(Array.isArray(result.list)).toBe(true);
        expect(result.total).toBeGreaterThan(0);
    });
    it('更新 PENDING 状态的申请', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        const result = await updateLeaveRequest(request.id, {
            reason: '修改后的请假理由',
        });
        expect(result).toBeDefined();
        expect(result.reason).toBe('修改后的请假理由');
    });
    it('更新非 PENDING 状态的申请失败', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        await approveLeaveRequest(request.id, {});
        await expect(updateLeaveRequest(request.id, {
            reason: '修改后的请假理由',
        })).rejects.toThrow(LeaveRequestError);
    });
    it('审批通过', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        const result = await approveLeaveRequest(request.id, { comment: '同意' });
        expect(result).toBeDefined();
        expect(result.status).toBe('APPROVED');
    });
    it('拒绝申请', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        const result = await rejectLeaveRequest(request.id, { reason: '工作繁忙' });
        expect(result).toBeDefined();
        expect(result.status).toBe('REJECTED');
    });
    it('取消申请', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-03',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '请假休息',
            attachments: [],
        });
        const result = await cancelLeaveRequest(request.id);
        expect(result).toBeDefined();
        expect(result.status).toBe('CANCELLED');
    });
    // ─── 并发扣减额度测试 ─────────────────────────────────
    it('并发审批同一请假申请只扣一次额度', async () => {
        const request = await createLeaveRequest({
            employeeId,
            type: 'ANNUAL',
            startDate: '2024-06-01',
            endDate: '2024-06-02',
            startTime: 'ALL',
            endTime: 'ALL',
            reason: '并发测试',
            attachments: [],
        });
        const beforeQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const beforeBalance = Number(beforeQuota?.annualBalance ?? 0);
        const results = await Promise.allSettled([
            approveLeaveRequest(request.id, { comment: '同意1' }),
            approveLeaveRequest(request.id, { comment: '同意2' }),
        ]);
        const successful = results.filter((r) => r.status === 'fulfilled');
        const failed = results.filter((r) => r.status === 'rejected');
        expect(successful.length).toBe(1);
        expect(failed.length).toBe(1);
        const afterQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const afterBalance = Number(afterQuota?.annualBalance ?? 0);
        expect(beforeBalance - afterBalance).toBe(2);
    });
    it('并发审批不同请假申请，额度扣减正确不超扣', async () => {
        const quota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const initialBalance = Number(quota?.annualBalance ?? 0);
        const dayPerRequest = 3;
        const requestCount = 3;
        const requests = [];
        for (let i = 0; i < requestCount; i++) {
            const r = await createLeaveRequest({
                employeeId,
                type: 'ANNUAL',
                startDate: `2024-0${i + 1}-01`,
                endDate: `2024-0${i + 1}-03`,
                startTime: 'ALL',
                endTime: 'ALL',
                reason: `并发测试_${i}`,
                attachments: [],
            });
            requests.push(r);
        }
        const results = await Promise.allSettled(requests.map((r) => approveLeaveRequest(r.id, { comment: '同意' })));
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const totalDeducted = successful * dayPerRequest;
        const afterQuota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year: 2024 } },
        });
        const afterBalance = Number(afterQuota?.annualBalance ?? 0);
        expect(initialBalance - afterBalance).toBe(totalDeducted);
        expect(afterBalance).toBeGreaterThanOrEqual(0);
    });
});
//# sourceMappingURL=leave-request.service.test.js.map