import { prisma } from '../lib/prisma.js';
import type { RankCreate, RankUpdate } from '@shared/schemas/org.js';

export async function createRank(data: RankCreate) {
  return prisma.rank.create({ data });
}

export async function getRankById(id: number) {
  return prisma.rank.findUnique({ where: { id } });
}

export async function listRanks() {
  return prisma.rank.findMany({ orderBy: [{ level: 'asc' }, { id: 'asc' }] });
}

export async function updateRank(id: number, data: RankUpdate) {
  return prisma.rank.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.level !== undefined && { level: data.level }),
    },
  });
}

export async function deleteRank(id: number) {
  await prisma.rank.delete({ where: { id } });
}
