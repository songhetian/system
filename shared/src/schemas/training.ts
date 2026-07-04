import { z } from "zod";
import { auditMixin, zDateString, zPaginationParams } from "./common";

// ═══════════════════ 培训课程 ═══════════════════

export const zTrainingType = z.enum(["ONLINE", "OFFLINE"]);

export const zTrainingCourseStatus = z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

export const zTrainingCourseCreateBase = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: zDateString,
  endDate: zDateString,
  type: zTrainingType,
  location: z.string().max(200).optional(),
  trainer: z.string().max(50).optional(),
  maxAttendees: z.number().int().positive().nullable().default(null),
});

export const zTrainingCourseCreate = zTrainingCourseCreateBase.superRefine((data, ctx) => {
  if (new Date(data.endDate) < new Date(data.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "结束日期不能早于开始日期",
      path: ["endDate"],
    });
  }
});

export const zTrainingCourseUpdate = zTrainingCourseCreateBase.partial();

export const zTrainingCourse = zTrainingCourseCreateBase
  .extend({
    id: z.number().int().positive(),
    status: zTrainingCourseStatus,
    enrolledCount: z.number().int().min(0),
  })
  .merge(auditMixin);

export const zTrainingCourseQuery = zPaginationParams.extend({
  status: zTrainingCourseStatus.optional(),
  keyword: z.string().max(200).optional(),
});

// 报名
export const zTrainingEnrollment = z.object({
  employeeIds: z.array(z.number().int().positive()).min(1),
});

// 完成
export const zTrainingCompletion = z.object({
  employeeId: z.number().int().positive(),
  score: z.number().min(0).max(100).nullable().default(null),
});

// 培训记录
export const zTrainingRecord = z.object({
  id: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeName: z.string(),
  courseName: z.string(),
  type: zTrainingType,
  startDate: zDateString,
  endDate: zDateString,
  score: z.number().nullable(),
  completedAt: z.string().datetime().nullable(),
});

export type TrainingType = z.infer<typeof zTrainingType>;
export type TrainingCourseStatus = z.infer<typeof zTrainingCourseStatus>;
export type TrainingCourseCreate = z.infer<typeof zTrainingCourseCreate>;
export type TrainingCourseUpdate = z.infer<typeof zTrainingCourseUpdate>;
export type TrainingCourse = z.infer<typeof zTrainingCourse>;
export type TrainingCourseQuery = z.infer<typeof zTrainingCourseQuery>;
export type TrainingEnrollment = z.infer<typeof zTrainingEnrollment>;
export type TrainingCompletion = z.infer<typeof zTrainingCompletion>;
export type TrainingRecord = z.infer<typeof zTrainingRecord>;
