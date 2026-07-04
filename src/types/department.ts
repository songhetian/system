// ============================================================
// src/types/department.ts — 部门模块：演示递归 z.lazy()
//
// 推导关系全景：
//   Create ──partial()──► Update
//   Create + id ──extend► EntityBase ──+ AuditMixin ──► Entity
//                                      + SoftDeleteMixin
//   Entity ── + z.lazy(children) ──► TreeNode（递归树节点）
//
// 核心技巧：
//   z.lazy() 解决自引用类型的无限递归 — children 是 TreeNode[]，
//   TreeNode 又包含 children，Zod 用 thunk 延迟求值破解这个循环。
// ============================================================

import { z } from 'zod';

// ── 共享原语 ─────────────────────────────────────────────
const auditMixin = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const softDeleteMixin = z.object({
  deletedAt: z.string().datetime().nullable(),
});

// ============================================================
// 第 1 步：Create — 输入端
// ============================================================
export const zDepartmentCreate = z.object({
  name: z.string().min(1).max(50),
  parentId: z.number().int().positive().nullable(),
  sortOrder: z.number().int().default(0),
});

// ============================================================
// 第 2 步：Update — 从 Create 推导
// ============================================================
export const zDepartmentUpdate = zDepartmentCreate.partial();

// ============================================================
// 第 3 步：Entity — 完整实体（Create + id + 审计 + 软删除）
// ============================================================
export const zDepartmentEntity = zDepartmentCreate
  .extend({
    id: z.number().int().positive(),
  })
  .merge(auditMixin)
  .merge(softDeleteMixin);

// ============================================================
// 第 4 步：TreeNode — 递归组织树节点
//
// z.lazy(() => ...) 是关键：将子节点数组的类型定义"延迟"到
// 首次求值时，避免 TypeScript 编译器和 Zod 遇到自引用循环。
//
// 效果：
//   TreeNode.children → TreeNode[] | undefined
//   每个 TreeNode 又可以有自己的 children，形成无限层树。
// ============================================================
export const zDepartmentTreeNode: z.ZodType<DepartmentTreeNode> = zDepartmentEntity.extend({
  children: z
    .lazy(() => z.array(zDepartmentTreeNode))
    .optional(),
});

// ── 显式类型标注（唯一的例外 — z.lazy() 需要这个 annotation）──
export interface DepartmentTreeNode extends z.infer<typeof zDepartmentEntity> {
  children?: DepartmentTreeNode[];
}

// ============================================================
// 第 5 步：TreeResponse — 整棵树响应
// ============================================================
export const zDepartmentTree = z.array(zDepartmentTreeNode);

// ============================================================
// 第 6 步：ListParams — 分页 + 过滤
// ============================================================
export const zDepartmentListParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  parentId: z.coerce.number().int().positive().optional(),
  keyword: z.string().optional(),
});

// ============================================================
// 第 7 步：类型导出
// ============================================================
export type DepartmentCreate = z.infer<typeof zDepartmentCreate>;
export type DepartmentUpdate = z.infer<typeof zDepartmentUpdate>;
export type DepartmentEntity = z.infer<typeof zDepartmentEntity>;
export type DepartmentTree = z.infer<typeof zDepartmentTree>;
export type DepartmentListParams = z.infer<typeof zDepartmentListParams>;
