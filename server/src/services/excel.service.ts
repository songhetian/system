import { prisma } from '../lib/prisma.js';
import { importQueue, addJob } from '../lib/bullmq.js';
import type { ExcelModule, ExcelTaskType } from '@shop/shared';

export async function createExcelTask(
  module: ExcelModule,
  type: ExcelTaskType,
  fileName: string,
  creatorId: number,
) {
  return prisma.excelTask.create({
    data: {
      module: module as any,
      type: type as any,
      fileName,
      creatorId,
    },
  });
}

export async function submitImportTask(
  module: ExcelModule,
  fileName: string,
  creatorId: number,
  fileBuffer: Buffer,
): Promise<{ taskId: number; jobId: string }> {
  const task = await createExcelTask(module, 'IMPORT', fileName, creatorId);

  const jobId = await addJob(importQueue, 'import', {
    taskId: task.id,
    module,
    fileBuffer: fileBuffer.toString('base64'),
  });

  return { taskId: task.id, jobId };
}

export async function getExcelTaskById(id: number) {
  return prisma.excelTask.findUnique({ where: { id } });
}

export async function listExcelTasks(creatorId?: number, module?: ExcelModule, status?: string) {
  const where: any = {};
  if (creatorId) where.creatorId = creatorId;
  if (module) where.module = module;
  if (status) where.status = status;

  return prisma.excelTask.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
  });
}

export async function updateExcelTaskProgress(
  id: number,
  processedRows: number,
  totalRows: number,
  successCount: number,
  failCount: number,
) {
  const progress = Math.round((processedRows / totalRows) * 100);
  return prisma.excelTask.update({
    where: { id },
    data: {
      processedRows,
      totalRows,
      successCount,
      failCount,
      status: processedRows >= totalRows ? 'COMPLETED' : 'PROCESSING',
    },
  });
}

export async function completeExcelTask(id: number, fileUrl?: string, errorFileUrl?: string) {
  return prisma.excelTask.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      fileUrl,
      errorFileUrl,
    },
  });
}

export async function failExcelTask(id: number, errorFileUrl?: string) {
  return prisma.excelTask.update({
    where: { id },
    data: {
      status: 'FAILED',
      errorFileUrl,
    },
  });
}

export async function processEmployeeImport(taskId: number, rows: any[]) {
  let successCount = 0;
  let failCount = 0;
  const errors: any[] = [];
  const BATCH_SIZE = 100;

  for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
    const employees = batch.map((row, i) => ({
      name: row.name ?? `员工${batchStart + i + 1}`,
      employeeNo: row.employeeNo ?? `EMP_${Date.now()}_${batchStart + i}`,
      phone: row.phone ?? '13800138000',
      idCard: row.idCard ?? '110101199001011234',
      hireDate: new Date(row.hireDate ?? '2024-01-01'),
      status: 'ACTIVE' as const,
    }));

    try {
      const result = await prisma.employee.createMany({ data: employees, skipDuplicates: true });
      successCount += result.count;
      failCount += batch.length - result.count;
    } catch (err: any) {
      failCount += batch.length;
      errors.push({ batch: batchStart + 1, error: err.message });
    }

    const processed = Math.min(batchStart + BATCH_SIZE, rows.length);
    await updateExcelTaskProgress(taskId, processed, rows.length, successCount, failCount);
  }

  return { successCount, failCount, errors };
}