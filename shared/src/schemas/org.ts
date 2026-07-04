import { z } from "zod";
import { auditMixin, softDeleteMixin, zPaginationParams } from "./common";

// ═══════════ 部门 ═══════════

export const zDepartmentCreate = z.object({
  name: z.string().min(1).max(100),
  parentId: z.number().int().positive().nullable().default(null),
  sortOrder: z.number().int().min(0).default(0),
});

export const zDepartmentUpdate = zDepartmentCreate.partial();

export const zDepartmentBase = zDepartmentCreate
  .extend({ id: z.number().int().positive() })
  .merge(auditMixin)
  .merge(softDeleteMixin);

export const zDepartment = zDepartmentBase.omit({ deletedAt: true });

export const zDepartmentQuery = zPaginationParams.extend({
  parentId: z.coerce.number().int().positive().optional(),
  keyword: z.string().max(200).optional(),
});

export const zDepartmentTreeNode: z.ZodType<DepartmentTreeNode> = zDepartment.extend({
  children: z.lazy(() => z.array(zDepartmentTreeNode)),
});

export const zDepartmentTree = z.array(zDepartmentTreeNode);

export type DepartmentCreate = z.infer<typeof zDepartmentCreate>;
export type DepartmentUpdate = z.infer<typeof zDepartmentUpdate>;
export type Department = z.infer<typeof zDepartment>;
export type DepartmentQuery = z.infer<typeof zDepartmentQuery>;
export interface DepartmentTreeNode extends Department { children: DepartmentTreeNode[] }
export type DepartmentTree = DepartmentTreeNode[];

// ═══════════ 岗位 ═══════════

export const zPositionCreate = z.object({
  name: z.string().min(1).max(100),
  departmentId: z.number().int().positive(),
  rankId: z.number().int().positive(),
  headcount: z.number().int().min(0).default(1),
});

export const zPositionUpdate = zPositionCreate.partial();

export const zPositionBase = zPositionCreate
  .extend({ id: z.number().int().positive(), departmentId: z.number().int().positive() })
  .merge(auditMixin)
  .merge(softDeleteMixin);

export const zPosition = zPositionBase.omit({ deletedAt: true });

export type PositionCreate = z.infer<typeof zPositionCreate>;
export type PositionUpdate = z.infer<typeof zPositionUpdate>;
export type Position = z.infer<typeof zPosition>;

// ═══════════ 职级 ═══════════

export const zRankCreate = z.object({
  name: z.string().min(1).max(50),
  level: z.number().int().min(1),
});

export const zRankUpdate = zRankCreate.partial();

export const zRank = zRankCreate.extend({ id: z.number().int().positive() }).merge(auditMixin);

export type RankCreate = z.infer<typeof zRankCreate>;
export type RankUpdate = z.infer<typeof zRankUpdate>;
export type Rank = z.infer<typeof zRank>;
