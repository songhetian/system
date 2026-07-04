import { z } from "zod";
import { auditMixin, softDeleteMixin } from "./common.js";

// ═══════════════════ 角色 ═══════════════════

export const zRoleCreate = z.object({
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(50).regex(/^[a-z_]+$/, "角色编码仅支持小写字母和下划线"),
  description: z.string().max(200).optional(),
});

export const zRoleUpdate = zRoleCreate.partial();

export const zRole = zRoleCreate
  .extend({ id: z.number().int().positive() })
  .merge(auditMixin)
  .merge(softDeleteMixin)
  .omit({ deletedAt: true });

export const zRolePermissionAssign = z.object({
  permissionIds: z.array(z.number().int().positive()),
});

export type RoleCreate = z.infer<typeof zRoleCreate>;
export type RoleUpdate = z.infer<typeof zRoleUpdate>;
export type Role = z.infer<typeof zRole>;
export type RolePermissionAssign = z.infer<typeof zRolePermissionAssign>;

// ═══════════════════ 权限 ═══════════════════

export const zPermission = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  group: z.string(),
});

export type Permission = z.infer<typeof zPermission>;

// ═══════════════════ 用户-角色 ─══════════════

export const zUserRoleAssign = z.object({
  roleIds: z.array(z.number().int().positive()),
});

export type UserRoleAssign = z.infer<typeof zUserRoleAssign>;
