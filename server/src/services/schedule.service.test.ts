import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import {
  createSchedule,
  findSchedulesByDateRange,
  deleteSchedule,
  checkConflicts,
  generateSchedule,
} from './schedule.service.js';
import type { ScheduleCreate } from '@shop/shared';

describe('Schedule Service', () => {
  let employeeId: number;
  let shiftTemplateId: number;
  let uniqueId: string;
  let createdSchedules: number[] = [];

  beforeEach(async () => {
    uniqueId = `TEST_SCH_${Date.now()}_${Math.random().toString(36).slice(-4)}`;
    const createdEmployee = await prisma.employee.create({
      data: {
        name: '测试员工',
        employeeNo: uniqueId,
        phone: '13800138000',
        idCard: `11010119900101${uniqueId.slice(-4)}`,
        hireDate: new Date(),
      },
    });
    employeeId = createdEmployee.id;

    const createdTemplate = await prisma.shiftTemplate.create({
      data: {
        name: `测试班次-${uniqueId}`,
        startTime: '08:00',
        endTime: '16:00',
        color: '#FF5733',
      },
    });
    shiftTemplateId = createdTemplate.id;
  });

  afterEach(async () => {
    for (const id of createdSchedules) {
      try {
        await prisma.schedule.delete({ where: { id } });
      } catch {}
    }
    createdSchedules = [];

    try {
      await prisma.schedule.deleteMany({ where: { employeeId } });
    } catch {}
    try {
      await prisma.shiftTemplate.delete({ where: { id: shiftTemplateId } });
    } catch {}
    try {
      await prisma.employee.delete({ where: { id: employeeId } });
    } catch {}
  });

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  it('创建排班记录成功', async () => {
    const testSchedule: ScheduleCreate = {
      employeeId,
      shiftTemplateId,
      date: today,
    };
    const result = await createSchedule(testSchedule);
    createdSchedules.push(result.id);
    expect(result).toHaveProperty('id');
    expect(result.employeeId).toBe(testSchedule.employeeId);
    expect(result.shiftTemplateId).toBe(testSchedule.shiftTemplateId);
    expect(result.date.toISOString().split('T')[0]).toBe(testSchedule.date);
  });

  it('创建同一天同一员工重复排班失败', async () => {
    const testSchedule: ScheduleCreate = {
      employeeId,
      shiftTemplateId,
      date: today,
    };
    const result = await createSchedule(testSchedule);
    createdSchedules.push(result.id);
    await expect(createSchedule(testSchedule)).rejects.toThrow('该员工当天已有排班记录');
  });

  it('查询排班记录', async () => {
    const testSchedule: ScheduleCreate = {
      employeeId,
      shiftTemplateId,
      date: today,
    };
    const result1 = await createSchedule(testSchedule);
    createdSchedules.push(result1.id);
    const result2 = await createSchedule({
      ...testSchedule,
      date: tomorrow,
    });
    createdSchedules.push(result2.id);

    const result = await findSchedulesByDateRange({
      startDate: today,
      endDate: tomorrow,
      employeeId,
    });
    expect(result.length).toBe(2);
  });

  it('删除排班记录', async () => {
    const testSchedule: ScheduleCreate = {
      employeeId,
      shiftTemplateId,
      date: today,
    };
    const created = await createSchedule(testSchedule);
    createdSchedules.push(created.id);

    const result = await deleteSchedule(created.id);
    expect(result).toBe(true);

    const index = createdSchedules.indexOf(created.id);
    if (index > -1) {
      createdSchedules.splice(index, 1);
    }

    const deleted = await prisma.schedule.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('检测冲突', async () => {
    const testSchedule: ScheduleCreate = {
      employeeId,
      shiftTemplateId,
      date: today,
    };
    const result = await createSchedule(testSchedule);
    createdSchedules.push(result.id);

    const conflicts = await checkConflicts({
      startDate: today,
      endDate: tomorrow,
    });
    expect(Array.isArray(conflicts)).toBe(true);
  });

  describe('generateSchedule - 排班生成', () => {
    let departmentId: number;
    let positionId: number;
    let rotationRuleId: number;
    let emp2Id: number;

    beforeEach(async () => {
      const dept = await prisma.department.create({
        data: { name: `测试部门_${Date.now()}` },
      });
      departmentId = dept.id;

      const rank = await prisma.rank.create({
        data: { name: '测试职级', level: 999 + Math.floor(Math.random() * 1000) },
      });

      const pos = await prisma.position.create({
        data: {
          name: '测试岗位',
          departmentId,
          rankId: rank.id,
        },
      });
      positionId = pos.id;

      await prisma.employeePosition.create({
        data: {
          employeeId,
          positionId,
          startDate: new Date(),
        },
      });

      const emp2 = await prisma.employee.create({
        data: {
          name: '测试员工2',
          employeeNo: `TEST2_${Date.now()}`,
          phone: '13900139000',
          idCard: '110101199002021234',
          hireDate: new Date(),
          employeePositions: {
            create: { positionId, startDate: new Date() },
          },
        },
      });
      emp2Id = emp2.id;

      const rule = await prisma.rotationRule.create({
        data: {
          name: `测试规则_${Date.now()}`,
          cycleDays: 2,
          pattern: [
            { dayOffset: 0, shiftTemplateId },
            { dayOffset: 1, shiftTemplateId: 0 },
          ],
        },
      });
      rotationRuleId = rule.id;
    });

    afterEach(async () => {
      try { await prisma.schedule.deleteMany({ where: { employeeId: { in: [employeeId, emp2Id] } } }); } catch {}
      try { await prisma.employeePosition.deleteMany({ where: { employeeId: { in: [employeeId, emp2Id] } } }); } catch {}
      try { await prisma.employee.delete({ where: { id: emp2Id } }); } catch {}
      try { await prisma.rotationRule.delete({ where: { id: rotationRuleId } }); } catch {}
      try { await prisma.position.delete({ where: { id: positionId } }); } catch {}
      try { await prisma.department.delete({ where: { id: departmentId } }); } catch {}
      try { await prisma.rank.deleteMany({ where: { level: { gte: 999 } } }); } catch {}
    });

    it('生成排班 - 成功创建符合规则的排班记录', async () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

      const result = await generateSchedule({
        rotationRuleId,
        departmentId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      expect(result.totalAssigned).toBe(4);
      expect(result.conflicting).toBe(0);
      expect(result.skippedLeave).toBe(0);

      const schedules = await prisma.schedule.findMany({
        where: { employeeId: { in: [employeeId, emp2Id] } },
      });
      expect(schedules.length).toBe(4);
    });

    it('生成排班 - 已有排班时计入 conflicting', async () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000);

      await prisma.schedule.create({
        data: {
          employeeId,
          shiftTemplateId,
          date: startDate,
        },
      });

      const result = await generateSchedule({
        rotationRuleId,
        departmentId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      expect(result.conflicting).toBeGreaterThanOrEqual(1);
    });
  });
});
