import { z } from "zod";
import {
  auditMixin,
  zDateString,
  zTimeString,
  zHexColor,
  zPaginationParams,
  zPaginatedData,
} from "./common.js";

// ═══════════════════ 班次模板 ═══════════════════

export const zShiftTemplateCreate = z.object({
  name: z.string().min(1).max(50),
  startTime: zTimeString,
  endTime: zTimeString,
  color: zHexColor,
  description: z.string().max(500).optional().default(""),
});

export const zShiftTemplateUpdate = zShiftTemplateCreate.partial();

export const zShiftTemplate = zShiftTemplateCreate
  .extend({ id: z.number().int().positive() })
  .merge(auditMixin);

export type ShiftTemplateCreate = z.infer<typeof zShiftTemplateCreate>;
export type ShiftTemplateUpdate = z.infer<typeof zShiftTemplateUpdate>;
export type ShiftTemplate = z.infer<typeof zShiftTemplate>;

// ═══════════════════ 轮班规则 ═══════════════════

export const zRotationPattern = z.object({
  dayOffset: z.number().int().min(0),
  shiftTemplateId: z.number().int().positive(),
});

export const zRotationRuleCreate = z.object({
  name: z.string().min(1).max(50),
  pattern: z.array(zRotationPattern).min(1),
  cycleDays: z.number().int().min(1),
}).superRefine((data, ctx) => {
  if (data.pattern.length !== data.cycleDays) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `pattern 长度 (${data.pattern.length}) 必须等于 cycleDays (${data.cycleDays})`,
      path: ["cycleDays"],
    });
  }
});

export const zRotationRule = zRotationRuleCreate
  .extend({ id: z.number().int().positive() })
  .merge(auditMixin);

export type RotationPattern = z.infer<typeof zRotationPattern>;
export type RotationRuleCreate = z.infer<typeof zRotationRuleCreate>;
export type RotationRule = z.infer<typeof zRotationRule>;

// ═══════════════════ 排班记录 ═══════════════════

export const zScheduleCreate = z.object({
  employeeId: z.number().int().positive(),
  shiftTemplateId: z.number().int().positive(),
  date: zDateString,
});

export const zScheduleUpdate = zScheduleCreate.partial();

export const zSchedule = zScheduleCreate
  .extend({
    id: z.number().int().positive(),
    shiftTemplate: zShiftTemplate.optional(),
  })
  .merge(auditMixin);

// 生成排班
export const zScheduleGenerateInput = z.object({
  startDate: zDateString,
  endDate: zDateString,
  departmentId: z.number().int().positive(),
  rotationRuleId: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (new Date(data.endDate) < new Date(data.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "结束日期不能早于开始日期",
      path: ["endDate"],
    });
  }
});

export const zScheduleGenerateResult = z.object({
  totalAssigned: z.number().int().min(0),
  conflicting: z.number().int().min(0),
  skippedLeave: z.number().int().min(0),
});

export const zScheduleClearRange = z.object({
  startDate: zDateString,
  endDate: zDateString,
  departmentId: z.number().int().positive(),
});

export const zScheduleQuery = zPaginationParams.extend({
  startDate: zDateString,
  endDate: zDateString,
  departmentId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
});

// 冲突
export const zScheduleConflict = z.object({
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  date: zDateString,
  conflicts: z.array(z.string()),
});

export type ScheduleCreate = z.infer<typeof zScheduleCreate>;
export type ScheduleUpdate = z.infer<typeof zScheduleUpdate>;
export type Schedule = z.infer<typeof zSchedule>;
export type ScheduleGenerateInput = z.infer<typeof zScheduleGenerateInput>;
export type ScheduleGenerateResult = z.infer<typeof zScheduleGenerateResult>;
export type ScheduleClearRange = z.infer<typeof zScheduleClearRange>;
export type ScheduleQuery = z.infer<typeof zScheduleQuery>;
export type ScheduleConflict = z.infer<typeof zScheduleConflict>;
