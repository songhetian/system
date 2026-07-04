import { z } from "zod";
import { auditMixin, zPaginationParams } from "./common";

// ═══════════════════ 知识库文档 ═══════════════════

export const zKbCategory = z.enum([
  "POLICY",       // 制度
  "COURSEWARE",   // 课件
  "FORM",         // 表单
  "CONTRACT",     // 合同
  "ANNOUNCEMENT", // 公告附件
]);

export const zKbDocumentCreate = z.object({
  title: z.string().min(1).max(200),
  category: zKbCategory,
  isConfidential: z.boolean().default(false),
  // file 字段由 multipart/form-data 单独处理
});

export const zKbDocument = zKbDocumentCreate
  .extend({
    id: z.number().int().positive(),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
    fileUrl: z.string(),
    uploaderId: z.number().int().positive(),
    uploaderName: z.string(),
  })
  .merge(auditMixin);

export const zKbDocumentQuery = zPaginationParams.extend({
  category: zKbCategory.optional(),
  keyword: z.string().max(200).optional(),
  uploadDateFrom: z.string().optional(),
  uploadDateTo: z.string().optional(),
});

export const zKbPreviewUrl = z.object({
  url: z.string(),
  expiresAt: z.string().datetime(),
});

export type KbCategory = z.infer<typeof zKbCategory>;
export type KbDocumentCreate = z.infer<typeof zKbDocumentCreate>;
export type KbDocument = z.infer<typeof zKbDocument>;
export type KbDocumentQuery = z.infer<typeof zKbDocumentQuery>;
export type KbPreviewUrl = z.infer<typeof zKbPreviewUrl>;
