import { z } from "zod";
import { auditMixin, zDateString, zPaginationParams } from "./common.js";

// ─── 基础枚举 ─────────────────────────────────────────────────

export const zLeaveType = z.enum([
  "ANNUAL",      // 年假
  "SICK",        // 病假
  "PERSONAL",    // 事假
  "COMPENSATORY", // 调休
  "MARRIAGE",    // 婚假
  "MATERNITY",   // 产假
]);

export const zLeaveTimeHalf = z.enum(["AM", "PM", "ALL"]);

// ═══════════════════ 假期额度 ═══════════════════

export const zLeaveQuotaInit = z.object({
  year: z.number().int().min(2020).max(2100),
});

export const zLeaveQuota = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  year: z.number().int(),
  annualBalance: z.number().min(0),
  annualUsed: z.number().min(0),
  sickUsed: z.number().min(0),
  personalUsed: z.number().min(0),
  compensatoryBalance: z.number().min(0),
});

export const zLeaveQuotaQuery = zPaginationParams.extend({
  year: z.coerce.number().int().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export type LeaveType = z.infer<typeof zLeaveType>;
export type LeaveTimeHalf = z.infer<typeof zLeaveTimeHalf>;
export type LeaveQuotaInit = z.infer<typeof zLeaveQuotaInit>;
export type LeaveQuota = z.infer<typeof zLeaveQuota>;
export type LeaveQuotaQuery = z.infer<typeof zLeaveQuotaQuery>;

// ═══════════════════ 请假申请 ═══════════════════

export const zLeaveRequestCreate = z.object({
  employeeId: z.number().int().positive(),
  type: zLeaveType,
  startDate: zDateString,
  endDate: zDateString,
  startTime: zLeaveTimeHalf,
  endTime: zLeaveTimeHalf,
  reason: z.string().min(1).max(500),
  attachments: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  // 结束日期不能早于开始日期
  if (new Date(data.endDate) < new Date(data.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "结束日期不能早于开始日期",
      path: ["endDate"],
    });
  }

  // 同一天请假时 AM/PM 逻辑
  const halfOrder: Record<string, number> = { AM: 0, PM: 1, ALL: 0 };
  if (data.startDate === data.endDate && data.startTime !== 'ALL') {
    if (halfOrder[data.startTime] > halfOrder[data.endTime]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "同一天请假结束时段不能早于开始时段",
        path: ["endTime"],
      });
    }
  }

  // 婚假/产假必须有附件
  if ((data.type === "MARRIAGE" || data.type === "MATERNITY") && data.attachments.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "婚假/产假需上传证明材料",
      path: ["attachments"],
    });
  }
});

// Update = Create.partial()（仅 PENDING 状态可用，业务层校验）
export const zLeaveRequestUpdate = zLeaveRequestCreate.partial();

export const zLeaveRequestStatus = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const zLeaveRequestBase = zLeaveRequestCreate
  .extend({
    id: z.number().int().positive(),
    status: zLeaveRequestStatus,
  })
  .merge(auditMixin);

export const zLeaveRequestListItem = zLeaveRequestBase.omit({
  reason: true,
  attachments: true,
});

export const zLeaveRequestQuery = zPaginationParams.extend({
  status: zLeaveRequestStatus.optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  dateFrom: zDateString.optional(),
  dateTo: zDateString.optional(),
});

// 审批
export const zLeaveApproval = z.object({
  comment: z.string().max(500).optional(),
});

export const zLeaveRejection = z.object({
  reason: z.string().min(1).max(500),
});

// 审批链路
export const zApprovalNodeStatus = z.enum(["PENDING", "APPROVED", "REJECTED", "SKIPPED"]);

export const zApprovalChainNode = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  assigneeName: z.string().nullable(),
  status: zApprovalNodeStatus,
  comment: z.string().nullable(),
  operatedAt: z.string().datetime().nullable(),
});

export const zApprovalChain = z.object({
  instanceId: z.number().int().positive(),
  nodes: z.array(zApprovalChainNode),
});

export type LeaveRequestCreate = z.infer<typeof zLeaveRequestCreate>;
export type LeaveRequestUpdate = z.infer<typeof zLeaveRequestUpdate>;
export type LeaveRequestStatus = z.infer<typeof zLeaveRequestStatus>;
export type LeaveRequestBase = z.infer<typeof zLeaveRequestBase>;
export type LeaveRequestListItem = z.infer<typeof zLeaveRequestListItem>;
export type LeaveRequestQuery = z.infer<typeof zLeaveRequestQuery>;
export type LeaveApproval = z.infer<typeof zLeaveApproval>;
export type LeaveRejection = z.infer<typeof zLeaveRejection>;
export type ApprovalNodeStatus = z.infer<typeof zApprovalNodeStatus>;
export type ApprovalChainNode = z.infer<typeof zApprovalChainNode>;
export type ApprovalChain = z.infer<typeof zApprovalChain>;
