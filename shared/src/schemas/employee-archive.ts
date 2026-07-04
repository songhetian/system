import { z } from 'zod';

export const ContractTypeEnum = z.enum(['TRIAL', 'REGULAR', 'PART_TIME', 'PROJECT']);
export const ContractStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']);
export const DocumentTypeEnum = z.enum([
  'ID_CARD_FRONT',
  'ID_CARD_BACK',
  'DRIVING_LICENSE',
  'EDUCATION_CERTIFICATE',
  'DEGREE_CERTIFICATE',
  'CONTRACT',
  'HEALTH_CERTIFICATE',
  'OTHER',
]);
export const EmployeeEventTypeEnum = z.enum([
  'HIRE',
  'REGULARIZE',
  'PROMOTE',
  'TRANSFER_DEPARTMENT',
  'TRANSFER_POSITION',
  'RESIGN',
  'REHIRE',
]);

export const zEmployeeContractCreate = z.object({
  employeeId: z.number(),
  type: ContractTypeEnum,
  startDate: z.string().date(),
  endDate: z.string().date(),
  probationEndDate: z.string().date().optional(),
  salary: z.number(),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  remark: z.string().max(500).optional(),
});

export const zEmployeeContractUpdate = z.object({
  type: ContractTypeEnum.optional(),
  endDate: z.string().date().optional(),
  salary: z.number().optional(),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  remark: z.string().max(500).optional(),
});

export const zEmployeeContract = z.object({
  id: z.number(),
  employeeId: z.number(),
  type: ContractTypeEnum,
  status: ContractStatusEnum,
  startDate: z.string().date(),
  endDate: z.string().date(),
  probationEndDate: z.string().date().optional(),
  salary: z.number(),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  remark: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const zEmployeeDocumentCreate = z.object({
  employeeId: z.number(),
  type: DocumentTypeEnum,
  filePath: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  verified: z.boolean().default(false),
  remark: z.string().max(200).optional(),
});

export const zEmployeeDocument = z.object({
  id: z.number(),
  employeeId: z.number(),
  type: DocumentTypeEnum,
  filePath: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  verified: z.boolean(),
  remark: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const zEmployeeEventCreate = z.object({
  employeeId: z.number(),
  type: EmployeeEventTypeEnum,
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  oldDepartmentId: z.number().optional(),
  newDepartmentId: z.number().optional(),
  oldPositionId: z.number().optional(),
  newPositionId: z.number().optional(),
  oldRankId: z.number().optional(),
  newRankId: z.number().optional(),
  effectiveDate: z.string().date(),
  operatorId: z.number().optional(),
  operatorName: z.string().optional(),
});

export const zEmployeeEvent = z.object({
  id: z.number(),
  employeeId: z.number(),
  type: EmployeeEventTypeEnum,
  title: z.string(),
  description: z.string().optional(),
  oldDepartmentId: z.number().optional(),
  newDepartmentId: z.number().optional(),
  oldPositionId: z.number().optional(),
  newPositionId: z.number().optional(),
  oldRankId: z.number().optional(),
  newRankId: z.number().optional(),
  effectiveDate: z.string().date(),
  operatorId: z.number().optional(),
  operatorName: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type ContractType = z.infer<typeof ContractTypeEnum>;
export type ContractStatus = z.infer<typeof ContractStatusEnum>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type EmployeeEventType = z.infer<typeof EmployeeEventTypeEnum>;
export type EmployeeContractCreate = z.infer<typeof zEmployeeContractCreate>;
export type EmployeeContractUpdate = z.infer<typeof zEmployeeContractUpdate>;
export type EmployeeContract = z.infer<typeof zEmployeeContract>;
export type EmployeeDocumentCreate = z.infer<typeof zEmployeeDocumentCreate>;
export type EmployeeDocument = z.infer<typeof zEmployeeDocument>;
export type EmployeeEventCreate = z.infer<typeof zEmployeeEventCreate>;
export type EmployeeEvent = z.infer<typeof zEmployeeEvent>;