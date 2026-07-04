import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { initLeaveQuota, findLeaveQuotaByFilter, findLeaveQuotaById, updateLeaveQuota, deductLeaveQuota, LeaveQuotaError, } from './leave-quota.service.js';
function toNumber(val) {
    return typeof val === 'number' ? val : Number(val);
}
function generateUniqueNo() {
    return `TEST${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
}
describe('LeaveQuotaService', () => {
    let employeeId;
    beforeEach(async () => {
        const employee = await prisma.employee.create({
            data: {
                name: '测试员工',
                employeeNo: generateUniqueNo(),
                phone: '13800138000',
                idCard: `11010119900101${Math.random().toString(10).substr(2, 4)}`,
                hireDate: new Date('2020-01-01'),
                status: 'ACTIVE',
            },
        });
        employeeId = employee.id;
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
    it('初始化年度假期额度', async () => {
        const result = await initLeaveQuota(2024);
        expect(result).toBeDefined();
        expect(result.count).toBeGreaterThan(0);
        const quota = await prisma.leaveQuota.findFirst({
            where: { employeeId, year: 2024 },
        });
        expect(quota).toBeDefined();
        expect(quota?.year).toBe(2024);
        expect(toNumber(quota?.annualBalance)).toBe(15);
    });
    it('查询假期额度列表', async () => {
        await initLeaveQuota(2024, [employeeId]);
        const result = await findLeaveQuotaByFilter({ year: 2024 });
        expect(Array.isArray(result.list)).toBe(true);
        expect(result.total).toBeGreaterThan(0);
        expect(result.list[0].year).toBe(2024);
    });
    it('根据 ID 获取假期额度', async () => {
        await initLeaveQuota(2024, [employeeId]);
        const quota = await prisma.leaveQuota.findFirst({
            where: { employeeId, year: 2024 },
        });
        expect(quota).toBeDefined();
        const result = await findLeaveQuotaById(quota.id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(quota.id);
        expect(result?.employeeId).toBe(employeeId);
    });
    it('更新假期额度', async () => {
        await initLeaveQuota(2024, [employeeId]);
        const quota = await prisma.leaveQuota.findFirst({
            where: { employeeId, year: 2024 },
        });
        expect(quota).toBeDefined();
        const result = await updateLeaveQuota(quota.id, {
            annualBalance: 20,
        });
        expect(result).toBeDefined();
        expect(toNumber(result?.annualBalance)).toBe(20);
    });
    it('扣除假期额度成功', async () => {
        await initLeaveQuota(2024, [employeeId]);
        const result = await deductLeaveQuota({
            employeeId,
            year: 2024,
            type: 'ANNUAL',
            days: 5,
        });
        expect(result).toBeDefined();
        expect(toNumber(result.annualBalance)).toBe(10);
        expect(toNumber(result.annualUsed)).toBe(5);
    });
    it('扣除假期额度超过余额失败', async () => {
        await initLeaveQuota(2024, [employeeId]);
        await expect(deductLeaveQuota({
            employeeId,
            year: 2024,
            type: 'ANNUAL',
            days: 20,
        })).rejects.toThrow(LeaveQuotaError);
    });
});
//# sourceMappingURL=leave-quota.service.test.js.map