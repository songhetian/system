import { z } from "zod";
import { auditMixin, zDateString, zPaginationParams } from "./common";

// ═══════════════════ 打卡记录 ═══════════════════

export const zClockType = z.enum(["IN", "OUT"]);

export const zAttendanceRecordCreate = z.object({
  employeeId: z.number().int().positive(),
  type: zClockType,
  timestamp: z.string().datetime(),
});

export const zAttendanceRecord = zAttendanceRecordCreate
  .extend({
    id: z.number().int().positive(),
    lateMinutes: z.number().int().min(0).default(0),
    earlyMinutes: z.number().int().min(0).default(0),
  })
  .merge(auditMixin);

export const zAttendanceRecordQuery = zPaginationParams.extend({
  employeeId: z.coerce.number().int().positive().optional(),
  dateFrom: zDateString.optional(),
  dateTo: zDateString.optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export type ClockType = z.infer<typeof zClockType>;
export type AttendanceRecordCreate = z.infer<typeof zAttendanceRecordCreate>;
export type AttendanceRecord = z.infer<typeof zAttendanceRecord>;
export type AttendanceRecordQuery = z.infer<typeof zAttendanceRecordQuery>;

// ═══════════════════ 考勤台账 ═══════════════════

export const zAttendanceSummaryGenerate = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  departmentId: z.number().int().positive().nullable().default(null),
});

export const zAttendanceSummary = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  shouldWorkDays: z.number().min(0),
  actualWorkDays: z.number().min(0),
  lateCount: z.number().int().min(0),
  earlyCount: z.number().int().min(0),
  overtimeHours: z.number().min(0),
  absentDays: z.number().min(0),
  locked: z.boolean(),
});

export const zAttendanceSummaryQuery = zPaginationParams.extend({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
});

export type AttendanceSummaryGenerate = z.infer<typeof zAttendanceSummaryGenerate>;
export type AttendanceSummary = z.infer<typeof zAttendanceSummary>;
export type AttendanceSummaryQuery = z.infer<typeof zAttendanceSummaryQuery>;
