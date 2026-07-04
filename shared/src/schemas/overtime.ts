import { z } from 'zod';

export const OvertimeTypeEnum = z.enum(['WEEKDAY', 'WEEKEND', 'HOLIDAY']);
export const OvertimeStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

export const zOvertimeRequestCreate = z.object({
  employeeId: z.number(),
  type: OvertimeTypeEnum,
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  reason: z.string().min(1).max(500),
  workflowTemplateId: z.number().optional(),
});

export const zOvertimeRequestUpdate = z.object({
  type: OvertimeTypeEnum.optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  reason: z.string().min(1).max(500).optional(),
});

export const zOvertimeRequest = z.object({
  id: z.number(),
  employeeId: z.number(),
  type: OvertimeTypeEnum,
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  reason: z.string(),
  status: OvertimeStatusEnum,
  approvedHours: z.number(),
  workflowInstanceId: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const zOvertimeRequestQuery = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
  employeeId: z.coerce.number().optional(),
  status: OvertimeStatusEnum.optional(),
  type: OvertimeTypeEnum.optional(),
});

export const zOvertimeRecordCreate = z.object({
  requestId: z.number(),
  actualStart: z.string().datetime(),
  actualEnd: z.string().datetime(),
  durationHours: z.number(),
  compensatoryHours: z.number().default(0),
});

export const zOvertimeRecord = z.object({
  id: z.number(),
  requestId: z.number(),
  employeeId: z.number(),
  actualStart: z.string().datetime(),
  actualEnd: z.string().datetime(),
  durationHours: z.number(),
  compensatoryHours: z.number(),
  createdAt: z.string().datetime(),
});

export type OvertimeType = z.infer<typeof OvertimeTypeEnum>;
export type OvertimeStatus = z.infer<typeof OvertimeStatusEnum>;
export type OvertimeRequestCreate = z.infer<typeof zOvertimeRequestCreate>;
export type OvertimeRequestUpdate = z.infer<typeof zOvertimeRequestUpdate>;
export type OvertimeRequest = z.infer<typeof zOvertimeRequest>;
export type OvertimeRequestQuery = z.infer<typeof zOvertimeRequestQuery>;
export type OvertimeRecordCreate = z.infer<typeof zOvertimeRecordCreate>;
export type OvertimeRecord = z.infer<typeof zOvertimeRecord>;