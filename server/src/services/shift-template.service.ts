import { prisma } from '../lib/prisma.js';
import type { ShiftTemplateCreate, ShiftTemplateUpdate } from '@shop/shared';

export class ShiftTemplateError extends Error {
  code: number;
  statusCode: number;

  constructor(message: string, code: number, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function createShiftTemplate(data: ShiftTemplateCreate) {
  try {
    return await prisma.shiftTemplate.create({ data });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      throw new ShiftTemplateError('班次模板名称已存在', 30001, 400);
    }
    throw new ShiftTemplateError('创建班次模板失败', 30002, 500);
  }
}

export async function findAllShiftTemplates() {
  return await prisma.shiftTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function findShiftTemplateById(id: number) {
  return await prisma.shiftTemplate.findUnique({ where: { id } });
}

export async function updateShiftTemplate(id: number, data: ShiftTemplateUpdate) {
  try {
    return await prisma.shiftTemplate.update({
      where: { id },
      data,
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      throw new ShiftTemplateError('班次模板名称已存在', 30001, 400);
    }
    if (error.code === 'P2025') {
      throw new ShiftTemplateError('班次模板不存在', 30003, 404);
    }
    throw new ShiftTemplateError('更新班次模板失败', 30004, 500);
  }
}

export async function deleteShiftTemplate(id: number) {
  const scheduleCount = await prisma.schedule.count({
    where: { shiftTemplateId: id },
  });

  if (scheduleCount > 0) {
    throw new ShiftTemplateError('该班次模板已被排班引用，无法删除', 30005, 400);
  }

  try {
    await prisma.shiftTemplate.delete({ where: { id } });
    return true;
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new ShiftTemplateError('班次模板不存在', 30003, 404);
    }
    throw new ShiftTemplateError('删除班次模板失败', 30006, 500);
  }
}