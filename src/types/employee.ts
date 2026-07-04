import { z } from "zod";
import {
  auditMixin,
  softDeleteMixin,
  zDateString,
  zPhone,
  zIdCard,
  zMasked,
  zPaginationParams,
} from "./common.js";

// ─── 状态枚举 ────────────────────────────────────────────────

export const EmployeeStatusEnum = z.enum([
  "PROBATION", // 试用期
  "ACTIVE", // 在职
  "RESIGNED", // 离职
]);

// ══════════════════════════════════════════════════════════════
//  Create
// ══════════════════════════════════════════════════════════════

export const zEmployeeCreate = z.object({
  name: z.string().min(1).max(30),
  employeeNo: z.string().min(1).max(20),
  phone: zPhone,
  email: z.string().email().optional(),
  idCard: zIdCard,
  hireDate: zDateString,
  departmentId: z.number().int().positive(),
  positionIds: z.array(z.number().int().positive()).min(1, "至少选择一个岗位"),
});

// ══════════════════════════════════════════════════════════════
//  Update = Create.partial()
// ══════════════════════════════════════════════════════════════

export const zEmployeeUpdate = zEmployeeCreate.partial();

// ══════════════════════════════════════════════════════════════
//  Base = Create + 服务端字段
// ══════════════════════════════════════════════════════════════

export const zEmployeeBase = zEmployeeCreate
  .extend({
    id: z.number().int().positive(),
    status: EmployeeStatusEnum,
    regularizeDate: zDateString.nullable(),
    resignDate: zDateString.nullable(),
  })
  .merge(auditMixin)
  .merge(softDeleteMixin);

// ══════════════════════════════════════════════════════════════
//  ListItem = Base 脱敏
// ══════════════════════════════════════════════════════════════

export const zEmployeeListItem = zEmployeeBase.extend({
  idCard: zMasked,
  phone: zMasked,
});

// ══════════════════════════════════════════════════════════════
//  FullDetail = Base 完整字段（需权限）
// ══════════════════════════════════════════════════════════════

export const zEmployeeFullDetail = zEmployeeBase.extend({
  emergencyContact: z.string().nullable().default(null),
  emergencyPhone: zPhone.nullable().default(null),
  address: z.string().nullable().default(null),
  remark: z.string().max(500).nullable().default(null),
});

// ══════════════════════════════════════════════════════════════
//  Query
// ══════════════════════════════════════════════════════════════

export const zEmployeeQuery = zPaginationParams.extend({
  departmentId: z.coerce.number().int().positive().optional(),
  positionId: z.coerce.number().int().positive().optional(),
  status: EmployeeStatusEnum.optional(),
  keyword: z.string().max(200).optional(),
});

// ══════════════════════════════════════════════════════════════
//  操作输入
// ══════════════════════════════════════════════════════════════

export const zRegularizeInput = z.object({
  regularizeDate: zDateString,
});

export const zResignInput = z.object({
  resignDate: zDateString,
  reason: z.string().min(1).max(500),
});

// ══════════════════════════════════════════════════════════════
//  批导入
// ══════════════════════════════════════════════════════════════

export const zBatchImportResult = z.object({
  successCount: z.number().int().min(0),
  failCount: z.number().int().min(0),
  errorFileUrl: z.string().nullable(),
});

// ══════════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════════

export type EmployeeStatus = z.infer<typeof EmployeeStatusEnum>;
export type EmployeeCreate = z.infer<typeof zEmployeeCreate>;
export type EmployeeUpdate = z.infer<typeof zEmployeeUpdate>;
export type EmployeeBase = z.infer<typeof zEmployeeBase>;
export type EmployeeListItem = z.infer<typeof zEmployeeListItem>;
export type EmployeeFullDetail = z.infer<typeof zEmployeeFullDetail>;
export type EmployeeQuery = z.infer<typeof zEmployeeQuery>;
export type RegularizeInput = z.infer<typeof zRegularizeInput>;
export type ResignInput = z.infer<typeof zResignInput>;
export type BatchImportResult = z.infer<typeof zBatchImportResult>;
