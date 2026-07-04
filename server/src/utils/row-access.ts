import { prisma } from '../lib/prisma.js';

interface RowAccessContext {
  userId: number;
  employeeId: number | null;
  permissions: Set<string>;
  dataScopes: Record<string, string>;
}

// 递归获取子部门 ID 列表
async function getChildDepartmentIds(parentId: number): Promise<number[]> {
  const children = await prisma.department.findMany({
    where: { parentId },
    select: { id: true },
  });
  const ids = children.map((c) => c.id);
  const grandChildren = await Promise.all(ids.map((id) => getChildDepartmentIds(id)));
  return [...ids, ...grandChildren.flat()];
}

export async function getEmployeeDepartmentId(employeeId: number): Promise<number | null> {
  const ep = await prisma.employeePosition.findFirst({
    where: { employeeId, endDate: null },
    include: { position: { select: { departmentId: true } } },
  });
  return ep?.position.departmentId ?? null;
}

// 获取部门及其所有子部门的 ID 列表
export async function getDepartmentAndChildrenIds(deptId: number): Promise<number[]> {
  const children = await getChildDepartmentIds(deptId);
  return [deptId, ...children];
}

/**
 * 构建行级权限过滤条件
 * @param ctx 请求上下文（含权限、数据范围）
 * @param entity 资源类型（如 'leave', 'attendance', 'employee'）
 * @returns Prisma where 条件
 */
export async function buildRowAccessFilter(
  ctx: RowAccessContext,
  entity: string,
): Promise<Record<string, any>> {
  // 超级管理员：无过滤
  if (ctx.permissions.has('admin:all')) {
    return {};
  }

  const scope = ctx.dataScopes?.[entity] || 'OWN';

  switch (scope) {
    case 'ALL':
      return {};

    case 'OWN':
      if (!ctx.employeeId) return { id: -1 };
      return buildOwnFilter(entity, ctx.employeeId);

    case 'DEPARTMENT': {
      if (!ctx.employeeId) return { id: -1 };
      const deptId = await getEmployeeDepartmentId(ctx.employeeId);
      if (!deptId) return { id: -1 };
      return buildDepartmentFilter(entity, [deptId]);
    }

    case 'DEPARTMENT_AND_CHILDREN': {
      if (!ctx.employeeId) return { id: -1 };
      const deptId = await getEmployeeDepartmentId(ctx.employeeId);
      if (!deptId) return { id: -1 };
      const deptIds = await getDepartmentAndChildrenIds(deptId);
      return buildDepartmentFilter(entity, deptIds);
    }

    default:
      return { id: -1 };
  }
}

function buildOwnFilter(entity: string, employeeId: number): Record<string, any> {
  switch (entity) {
    case 'employee':
      return { id: employeeId };
    case 'payslip':
    case 'salaryRecord':
    case 'attendance':
    case 'leave':
    case 'overtime':
    case 'expense':
    case 'training':
      return { employeeId };
    default:
      return { id: -1 };
  }
}

function buildDepartmentFilter(entity: string, deptIds: number[]): Record<string, any> {
  // 通过 employee → employeePosition → position → department 关联过滤
  const deptFilter = {
    employeePositions: {
      some: {
        position: {
          departmentId: { in: deptIds },
        },
      },
    },
  };

  switch (entity) {
    case 'employee':
      return deptFilter;
    case 'payslip':
    case 'salaryRecord':
    case 'attendance':
    case 'leave':
    case 'overtime':
    case 'expense':
    case 'training':
      return { employee: deptFilter };
    default:
      return { id: -1 };
  }
}
