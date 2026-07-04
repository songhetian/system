import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { generate, findByFilter, findById, lock, unlock } from './attendance-summary.service.js';
describe('AttendanceSummaryService', () => {
    let employeeId;
    let shiftTemplateId;
    let uniqueId;
    beforeEach(async () => {
        uniqueId = `TEST_AS_${Date.now()}_${Math.random().toString(36).slice(-4)}`;
        const employee = await prisma.employee.create({
            data: {
                name: '测试员工',
                employeeNo: uniqueId,
                phone: '13800138000',
                idCard: `11010119900101${uniqueId.slice(-4)}`,
                hireDate: new Date('2024-01-01'),
            },
        });
        employeeId = employee.id;
        const shiftTemplate = await prisma.shiftTemplate.create({
            data: {
                name: `标准班次-${uniqueId}`,
                startTime: '09:00',
                endTime: '18:00',
                color: '#3B82F6',
            },
        });
        shiftTemplateId = shiftTemplate.id;
        for (let i = 1; i <= 22; i++) {
            await prisma.schedule.create({
                data: {
                    employeeId,
                    shiftTemplateId: shiftTemplate.id,
                    date: new Date(`2024-01-${i.toString().padStart(2, '0')}`),
                },
            });
        }
        await prisma.attendanceRecord.create({
            data: {
                employeeId,
                type: 'IN',
                timestamp: new Date('2024-01-02T09:00:00'),
                lateMinutes: 0,
            },
        });
        await prisma.attendanceRecord.create({
            data: {
                employeeId,
                type: 'OUT',
                timestamp: new Date('2024-01-02T18:00:00'),
                earlyMinutes: 0,
            },
        });
        await prisma.attendanceRecord.create({
            data: {
                employeeId,
                type: 'IN',
                timestamp: new Date('2024-01-03T09:30:00'),
                lateMinutes: 30,
            },
        });
        await prisma.attendanceRecord.create({
            data: {
                employeeId,
                type: 'OUT',
                timestamp: new Date('2024-01-03T17:30:00'),
                earlyMinutes: 30,
            },
        });
    });
    afterEach(async () => {
        await prisma.attendanceSummary.deleteMany({
            where: { employeeId },
        });
        await prisma.attendanceRecord.deleteMany({
            where: { employeeId },
        });
        await prisma.schedule.deleteMany({
            where: { employeeId },
        });
        await prisma.shiftTemplate.deleteMany({
            where: { id: shiftTemplateId },
        });
        await prisma.employee.deleteMany({
            where: { employeeNo: uniqueId },
        });
    });
    it('生成月度考勤台账', async () => {
        const result = await generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        });
        expect(result).toBeGreaterThan(0);
    });
    it('查询考勤台账列表', async () => {
        await generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        });
        const result = await findByFilter({
            year: 2024,
            month: 1,
            employeeId,
        });
        expect(result.list.length).toBeGreaterThan(0);
        expect(result.total).toBeGreaterThan(0);
    });
    it('根据ID获取考勤台账', async () => {
        await generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        });
        const summaries = await prisma.attendanceSummary.findMany({
            where: { employeeId },
        });
        const result = await findById(summaries[0].id);
        expect(result).not.toBeNull();
        expect(result.id).toBe(summaries[0].id);
        expect(result.employeeId).toBe(employeeId);
    });
    it('锁定考勤台账', async () => {
        await generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        });
        const summaries = await prisma.attendanceSummary.findMany({
            where: { employeeId },
        });
        const result = await lock(summaries[0].id);
        expect(result.locked).toBe(true);
    });
    it('解锁考勤台账', async () => {
        await generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        });
        const summaries = await prisma.attendanceSummary.findMany({
            where: { employeeId },
        });
        await lock(summaries[0].id);
        const result = await unlock(summaries[0].id);
        expect(result.locked).toBe(false);
    });
    it('锁定考勤台账后不可修改', async () => {
        await generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        });
        const summaries = await prisma.attendanceSummary.findMany({
            where: { employeeId },
        });
        await lock(summaries[0].id);
        await expect(generate({
            year: 2024,
            month: 1,
            departmentId: null,
            employeeId,
        })).rejects.toThrow('考勤台账已锁定，无法修改');
    });
});
//# sourceMappingURL=attendance-summary.service.test.js.map