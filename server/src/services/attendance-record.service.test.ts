import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { clock, findByFilter, findById } from './attendance-record.service.js';

describe('AttendanceRecordService', () => {
  let employeeId: number;
  let shiftTemplateId: number;
  let uniqueId: string;

  beforeEach(async () => {
    uniqueId = `TEST_AR_${Date.now()}_${Math.random().toString(36).slice(-4)}`;
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

    await prisma.schedule.create({
      data: {
        employeeId,
        shiftTemplateId: shiftTemplate.id,
        date: new Date('2024-01-15'),
      },
    });
  });

  afterEach(async () => {
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

  it('上班打卡成功', async () => {
    const result = await clock({
      employeeId,
      type: 'IN',
      timestamp: new Date('2024-01-15T09:00:00'),
    });

    expect(result.employeeId).toBe(employeeId);
    expect(result.type).toBe('IN');
    expect(result.lateMinutes).toBe(0);
  });

  it('下班打卡成功', async () => {
    const result = await clock({
      employeeId,
      type: 'OUT',
      timestamp: new Date('2024-01-15T18:00:00'),
    });

    expect(result.employeeId).toBe(employeeId);
    expect(result.type).toBe('OUT');
    expect(result.earlyMinutes).toBe(0);
  });

  it('自动计算迟到分钟数', async () => {
    const result = await clock({
      employeeId,
      type: 'IN',
      timestamp: new Date('2024-01-15T09:30:00'),
    });

    expect(result.lateMinutes).toBe(30);
  });

  it('自动计算早退分钟数', async () => {
    const result = await clock({
      employeeId,
      type: 'OUT',
      timestamp: new Date('2024-01-15T17:30:00'),
    });

    expect(result.earlyMinutes).toBe(30);
  });

  it('查询打卡记录', async () => {
    await clock({
      employeeId,
      type: 'IN',
      timestamp: new Date('2024-01-15T09:00:00'),
    });

    await clock({
      employeeId,
      type: 'OUT',
      timestamp: new Date('2024-01-15T18:00:00'),
    });

    const result = await findByFilter({
      employeeId,
      dateFrom: '2024-01-15',
      dateTo: '2024-01-15',
    });

    expect(result.list.length).toBe(2);
    expect(result.total).toBe(2);
  });

  it('根据ID获取打卡记录', async () => {
    const record = await clock({
      employeeId,
      type: 'IN',
      timestamp: new Date('2024-01-15T09:00:00'),
    });

    const result = await findById(record.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(record.id);
    expect(result!.employeeId).toBe(employeeId);
  });

  it('根据ID获取不存在的打卡记录返回null', async () => {
    const result = await findById(99999);

    expect(result).toBeNull();
  });
});
