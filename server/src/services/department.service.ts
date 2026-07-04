import { prisma } from '../lib/prisma.js';
import { getCache, setCache, deleteCache } from '../lib/redis.js';
import { Errors } from '../lib/errors.js';
import type { DepartmentCreate, DepartmentUpdate, DepartmentQuery } from '@shared/schemas/org.js';

const DEPT_TREE_CACHE_KEY = 'dept:tree';
const DEPT_TREE_CACHE_TTL = 300; // 5 分钟

export async function createDepartment(data: DepartmentCreate) {
  if (data.parentId) {
    const parent = await prisma.department.findUnique({
      where: { id: data.parentId, deletedAt: null },
    });
    if (!parent) {
      throw Errors.notFound('父部门不存在');
    }
  }

  return prisma.department.create({
    data: {
      name: data.name,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
    },
  }).then(async (dept) => {
    await deleteCache(DEPT_TREE_CACHE_KEY);
    return dept;
  });
}

export async function getDepartmentById(id: number) {
  return prisma.department.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function listDepartments(query: DepartmentQuery) {
  const { page = 1, pageSize = 10, parentId, keyword } = query;

  const where: any = { deletedAt: null };
  if (parentId !== undefined) {
    where.parentId = parentId;
  }
  if (keyword) {
    where.name = { contains: keyword };
  }

  const [list, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.department.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function updateDepartment(id: number, data: DepartmentUpdate) {
  if (data.parentId !== undefined && data.parentId !== null) {
    if (data.parentId === id) {
      throw Errors.validation('父部门不能是自己');
    }
    const parent = await prisma.department.findUnique({
      where: { id: data.parentId, deletedAt: null },
    });
    if (!parent) {
      throw Errors.notFound('父部门不存在');
    }
  }

  const result = await prisma.department.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
  await deleteCache(DEPT_TREE_CACHE_KEY);
  return result;
}

export async function deleteDepartment(id: number) {
  await prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await deleteCache(DEPT_TREE_CACHE_KEY);
}

export async function getDepartmentTree() {
  const cached = await getCache<any[]>(DEPT_TREE_CACHE_KEY);
  if (cached) return cached;

  const allDepts = await prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });

  const map = new Map<number, any>();
  const roots: any[] = [];

  for (const dept of allDepts) {
    map.set(dept.id, { ...dept, children: [] });
  }

  for (const dept of allDepts) {
    const node = map.get(dept.id)!;
    if (dept.parentId && map.has(dept.parentId)) {
      map.get(dept.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  await setCache(DEPT_TREE_CACHE_KEY, roots, DEPT_TREE_CACHE_TTL);

  return roots;
}
