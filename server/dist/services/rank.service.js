import { prisma } from '../lib/prisma.js';
export async function createRank(data) {
    return prisma.rank.create({ data });
}
export async function getRankById(id) {
    return prisma.rank.findUnique({ where: { id } });
}
export async function listRanks() {
    return prisma.rank.findMany({ orderBy: [{ level: 'asc' }, { id: 'asc' }] });
}
export async function updateRank(id, data) {
    return prisma.rank.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.level !== undefined && { level: data.level }),
        },
    });
}
export async function deleteRank(id) {
    await prisma.rank.delete({ where: { id } });
}
//# sourceMappingURL=rank.service.js.map