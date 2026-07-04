import { prisma } from '../lib/prisma.js';
import { type LeaveQuotaQuery } from '@shop/shared';

export class LeaveQuotaError extends Error {
  code: number;
  statusCode: number;

  constructor(message: string, code: number, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

const DEFAULT_ANNUAL_DAYS = 15;

export async function initLeaveQuota(year: number, employeeIds?: number[]) {
  const where: any = { status: 'ACTIVE', deletedAt: null };
  if (employeeIds && employeeIds.length > 0) {
    where.id = { in: employeeIds };
  }

  const activeEmployees = await prisma.employee.findMany({
    where,
    select: { id: true },
  });

  let count = 0;
  for (const emp of activeEmployees) {
    try {
      const created = await prisma.leaveQuota.upsert({
        where: { employeeId_year: { employeeId: emp.id, year } },
        update: {},
        create: {
          employeeId: emp.id,
          year,
          annualBalance: DEFAULT_ANNUAL_DAYS,
          annualUsed: 0,
          sickUsed: 0,
          personalUsed: 0,
          compensatoryBalance: 0,
        },
      });
      if (created) count++;
    } catch (err: any) {
      // ponytail: 并发场景下员工可能已被删除，跳过即可
      if (err?.code === 'P2003') continue;
      throw err;
    }
  }

  return { count };
}

export async function findLeaveQuotaByFilter(params: LeaveQuotaQuery) {
  const { page = 1, pageSize = 10, year, employeeId, departmentId } = params;

  const where: any = {};

  if (year !== undefined) {
    where.year = year;
  }

  if (employeeId !== undefined) {
    where.employeeId = employeeId;
  }

  if (departmentId !== undefined) {
    where.employee = {
      employeePositions: {
        some: {
          position: {
            departmentId,
          },
        },
      },
    };
  }

  const [list, total] = await Promise.all([
    prisma.leaveQuota.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.leaveQuota.count({ where }),
  ]);

  return {
    list: list.map((item) => ({
      ...item,
      employeeName: item.employee.name,
    })),
    total,
    page,
    pageSize,
  };
}

export async function findLeaveQuotaById(id: number) {
  const quota = await prisma.leaveQuota.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!quota) {
    throw new LeaveQuotaError('假期额度不存在', 30001, 404);
  }

  return {
    ...quota,
    employeeName: quota.employee.name,
  };
}

export async function updateLeaveQuota(id: number, data: Partial<{
  annualBalance: number;
  annualUsed: number;
  sickUsed: number;
  personalUsed: number;
  compensatoryBalance: number;
}>) {
  const quota = await prisma.leaveQuota.findUnique({
    where: { id },
  });

  if (!quota) {
    throw new LeaveQuotaError('假期额度不存在', 30001, 404);
  }

  const updated = await prisma.leaveQuota.update({
    where: { id },
    data,
    include: {
      employee: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...updated,
    employeeName: updated.employee.name,
  };
}

export async function deductLeaveQuota(
  data: {
    employeeId: number;
    year: number;
    type: 'ANNUAL' | 'SICK' | 'PERSONAL' | 'COMPENSATORY';
    days: number;
  },
  tx?: any,
) {
  const { employeeId, year, type, days } = data;
  const db = tx || prisma;

  const quota = await db.leaveQuota.findUnique({
    where: { employeeId_year: { employeeId, year } },
  });

  if (!quota) {
    throw new LeaveQuotaError('假期额度不存在', 30001, 404);
  }

  const updateData: any = {};

  switch (type) {
    case 'ANNUAL':
      if (quota.annualBalance < days) {
        throw new LeaveQuotaError('假期余额不足', 30002, 400);
      }
      updateData.annualBalance = quota.annualBalance - days;
      updateData.annualUsed = quota.annualUsed + days;
      break;
    case 'SICK':
      updateData.sickUsed = quota.sickUsed + days;
      break;
    case 'PERSONAL':
      updateData.personalUsed = quota.personalUsed + days;
      break;
    case 'COMPENSATORY':
      if (quota.compensatoryBalance < days) {
        throw new LeaveQuotaError('调休余额不足', 30002, 400);
      }
      updateData.compensatoryBalance = quota.compensatoryBalance - days;
      break;
  }

  const updated = await db.leaveQuota.update({
    where: { id: quota.id },
    data: updateData,
    include: {
      employee: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...updated,
    employeeName: updated.employee.name,
  };
}