import { z } from "zod";
import { auditMixin, zDateString, zNonNegativeNumber, zPaginationParams } from "./common.js";

// ═══════════════════ 报销单 ═══════════════════

export const zExpenseType = z.enum([
  "TRAVEL",
  "OFFICE",
  "ENTERTAINMENT",
  "OTHER",
]);

export const zExpenseClaimStatus = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const zExpenseClaimCreate = z.object({
  title: z.string().min(1).max(200),
  expenseType: zExpenseType,
  amount: zNonNegativeNumber.refine((v) => v > 0, "金额必须大于 0"),
  description: z.string().max(1000).optional(),
  attachments: z.array(z.string()).default([]),
});

export const zExpenseClaimUpdate = zExpenseClaimCreate.partial();

export const zExpenseClaimBase = zExpenseClaimCreate
  .extend({
    id: z.number().int().positive(),
    employeeId: z.number().int().positive(),
    status: zExpenseClaimStatus,
  })
  .merge(auditMixin);

export const zExpenseClaim = zExpenseClaimBase;

export const zExpenseClaimQuery = zPaginationParams.extend({
  status: zExpenseClaimStatus.optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  dateFrom: zDateString.optional(),
  dateTo: zDateString.optional(),
});

export type ExpenseType = z.infer<typeof zExpenseType>;
export type ExpenseClaimStatus = z.infer<typeof zExpenseClaimStatus>;
export type ExpenseClaimCreate = z.infer<typeof zExpenseClaimCreate>;
export type ExpenseClaimUpdate = z.infer<typeof zExpenseClaimUpdate>;
export type ExpenseClaim = z.infer<typeof zExpenseClaim>;
export type ExpenseClaimQuery = z.infer<typeof zExpenseClaimQuery>;
