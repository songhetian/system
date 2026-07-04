import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import type { PositionCreate, PositionUpdate } from '@shared/schemas/org.js';

export async function createPosition(departmentId: number, data: PositionCreate) {
  const dept = await prisma.department.findUnique({
    where: { id: departmentId, deletedAt: null },
  });
  if (!dept) {
    throw Errors.notFound('部门不存在');
  }

  const rank = await prisma.rank.findUnique({ where: { id: data.rankId } });
  if (!rank) {
    throw Errors.notFound('职级不存在');
  }

  return prisma.position.create({
    data: {
      name: data.name,
      departmentId,
      rankId: data.rankId,
      headcount: data.headcount,
    },
  });
}

export async function getPositionById(id: number) {
  return prisma.position.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function listPositions(params: {
  page: number;
  pageSize: number;
  departmentId?: number;
  keyword?: string;
}) {
  const { page, pageSize, departmentId, keyword } = params;

  const where: any = { deletedAt: null };
  if (departmentId !== undefined) {
    where.departmentId = departmentId;
  }
  if (keyword) {
    where.name = { contains: keyword };
  }

  const [list, total] = await Promise.all([
    prisma.position.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ id: 'asc' }],
    }),
    prisma.position.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function updatePosition(id: number, data: PositionUpdate) {
  if (data.rankId !== undefined) {
    const rank = await prisma.rank.findUnique({ where: { id: data.rankId } });
    if (!rank) {
      throw Errors.notFound('职级不存在');
    }
  }

  return prisma.position.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.rankId !== undefined && { rankId: data.rankId }),
      ...(data.headcount !== undefined && { headcount: data.headcount }),
    },
  });
}

export async function deletePosition(id: number) {
  await prisma.position.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
