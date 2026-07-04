import { z } from 'zod';

export const DataScopeEnum = z.enum(['OWN', 'DEPARTMENT', 'DEPARTMENT_AND_CHILDREN', 'ALL']);

export const zDataPermissionCreate = z.object({
  userId: z.number().optional(),
  roleId: z.number().optional(),
  resourceType: z.string().min(1).max(50),
  scope: DataScopeEnum,
  departmentId: z.number().optional(),
});

export const zDataPermissionUpdate = z.object({
  resourceType: z.string().min(1).max(50),
  scope: DataScopeEnum,
  departmentId: z.number().optional(),
});

export const zDataPermissionQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.coerce.number().optional(),
  roleId: z.coerce.number().optional(),
  resourceType: z.string().optional(),
});

export type DataPermissionCreate = z.infer<typeof zDataPermissionCreate>;
export type DataPermissionUpdate = z.infer<typeof zDataPermissionUpdate>;
export type DataPermissionQuery = z.infer<typeof zDataPermissionQuery>;