import { z } from "zod";

// ═══════════════════ 导入/导出 ═══════════════════

export const zExcelModule = z.enum([
  "employee",
  "schedule",
  "attendance",
  "leave",
  "salary",
  "expense",
  "training",
]);

export const zTaskStatus = z.enum(["PROCESSING", "COMPLETED", "FAILED"]);

export const zImportResult = z.object({
  successCount: z.number().int().min(0),
  failCount: z.number().int().min(0),
  errorFileUrl: z.string().nullable(),
});

export const zImportProgress = z.object({
  status: zTaskStatus,
  progress: z.number().int().min(0).max(100),
  totalRows: z.number().int().min(0),
  processedRows: z.number().int().min(0),
});

export type ExcelModule = z.infer<typeof zExcelModule>;
export type TaskStatus = z.infer<typeof zTaskStatus>;
export type ImportResult = z.infer<typeof zImportResult>;
export type ImportProgress = z.infer<typeof zImportProgress>;
