import { z } from "zod";
import { auditMixin, zMasked, zNonNegativeNumber, zPaginationParams } from "./common";

// ═══════════════════ 二级密码 ═══════════════════

export const zSalaryPasswordVerify = z.object({
  password: z.string().min(1).max(100),
});

export const zSalaryPasswordVerifyResult = z.object({
  token: z.string(),
  expiresIn: z.number().int().positive(),
});

export const zSalaryPasswordSet = z.object({
  oldPassword: z.string().max(100).optional(),
  newPassword: z.string().min(6).max(100),
});

export type SalaryPasswordVerify = z.infer<typeof zSalaryPasswordVerify>;
export type SalaryPasswordVerifyResult = z.infer<typeof zSalaryPasswordVerifyResult>;
export type SalaryPasswordSet = z.infer<typeof zSalaryPasswordSet>;

// ═══════════════════ 薪资结构 ═══════════════════

export const zSalaryItemType = z.enum([
  "BASE",        // 基本工资
  "PERFORMANCE", // 绩效
  "SUBSIDY",     // 补贴
  "INSURANCE",   // 社保
  "TAX",         // 个税
  "DEDUCTION",   // 扣款
]);

export const zSalaryItemCreate = z.object({
  type: zSalaryItemType,
  name: z.string().min(1).max(50),
  formula: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).default(0),
});

export const zSalaryStructureCreate = z.object({
  name: z.string().min(1).max(50),
  items: z.array(zSalaryItemCreate).min(1, "至少包含一个薪资项"),
});

export const zSalaryStructureUpdate = zSalaryStructureCreate.partial();

export const zSalaryStructure = zSalaryStructureCreate
  .extend({ id: z.number().int().positive() })
  .merge(auditMixin);

export const zSalaryStructureAssign = z.object({
  employeeIds: z.array(z.number().int().positive()).min(1),
});

export type SalaryItemType = z.infer<typeof zSalaryItemType>;
export type SalaryItemCreate = z.infer<typeof zSalaryItemCreate>;
export type SalaryStructureCreate = z.infer<typeof zSalaryStructureCreate>;
export type SalaryStructureUpdate = z.infer<typeof zSalaryStructureUpdate>;
export type SalaryStructure = z.infer<typeof zSalaryStructure>;
export type SalaryStructureAssign = z.infer<typeof zSalaryStructureAssign>;

// ═══════════════════ 工资条 ═══════════════════

export const zPayslipItem = z.object({
  type: zSalaryItemType,
  name: z.string(),
  amount: zNonNegativeNumber,
});

export const zPayslipGenerate = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  departmentId: z.number().int().positive().nullable().default(null),
});

/** 列表项 — 金额脱敏 */
export const zPayslipListItem = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  departmentName: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  grossPay: zMasked,
  deductions: zMasked,
  netPay: zMasked,
});

/** 详情 — 完整金额 */
export const zPayslipFullDetail = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  departmentName: z.string(),
  positionName: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  items: z.array(zPayslipItem),
  grossPay: zNonNegativeNumber,
  deductions: zNonNegativeNumber,
  netPay: zNonNegativeNumber,
  generatedAt: z.string().datetime(),
});

export const zPayslipQuery = zPaginationParams.extend({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
});

export type PayslipItem = z.infer<typeof zPayslipItem>;
export type PayslipGenerate = z.infer<typeof zPayslipGenerate>;
export type PayslipListItem = z.infer<typeof zPayslipListItem>;
export type PayslipFullDetail = z.infer<typeof zPayslipFullDetail>;
export type PayslipQuery = z.infer<typeof zPayslipQuery>;

// ═══════════════════ 薪资审计 ═══════════════════

export const zSalaryAuditAction = z.enum([
  "VIEW_SALARY",
  "VIEW_PAYSLIP",
  "EXPORT_SALARY",
  "VERIFY_PASSWORD_SUCCESS",
  "VERIFY_PASSWORD_FAIL",
]);

export const zSalaryAuditLog = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  username: z.string(),
  action: zSalaryAuditAction,
  ip: z.string(),
  createdAt: z.string().datetime(),
});

export const zSalaryAuditLogQuery = zPaginationParams.extend({
  userId: z.coerce.number().int().positive().optional(),
  action: zSalaryAuditAction.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type SalaryAuditAction = z.infer<typeof zSalaryAuditAction>;
export type SalaryAuditLog = z.infer<typeof zSalaryAuditLog>;
export type SalaryAuditLogQuery = z.infer<typeof zSalaryAuditLogQuery>;
