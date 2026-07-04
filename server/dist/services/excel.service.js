import { prisma } from '../lib/prisma.js';
import { importQueue, addJob } from '../lib/bullmq.js';
export async function createExcelTask(module, type, fileName, creatorId) {
    return prisma.excelTask.create({
        data: {
            module: module,
            type: type,
            fileName,
            creatorId,
        },
    });
}
export async function submitImportTask(module, fileName, creatorId, fileBuffer) {
    const task = await createExcelTask(module, 'IMPORT', fileName, creatorId);
    const jobId = await addJob(importQueue, 'import', {
        taskId: task.id,
        module,
        fileBuffer: fileBuffer.toString('base64'),
    });
    return { taskId: task.id, jobId };
}
export async function getExcelTaskById(id) {
    return prisma.excelTask.findUnique({ where: { id } });
}
export async function listExcelTasks(creatorId, module, status) {
    const where = {};
    if (creatorId)
        where.creatorId = creatorId;
    if (module)
        where.module = module;
    if (status)
        where.status = status;
    return prisma.excelTask.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: 100,
    });
}
export async function updateExcelTaskProgress(id, processedRows, totalRows, successCount, failCount) {
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
export async function completeExcelTask(id, fileUrl, errorFileUrl) {
    return prisma.excelTask.update({
        where: { id },
        data: {
            status: 'COMPLETED',
            fileUrl,
            errorFileUrl,
        },
    });
}
export async function failExcelTask(id, errorFileUrl) {
    return prisma.excelTask.update({
        where: { id },
        data: {
            status: 'FAILED',
            errorFileUrl,
        },
    });
}
export async function processEmployeeImport(taskId, rows) {
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    const BATCH_SIZE = 100;
    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
        const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
        const employees = batch.map((row, i) => ({
            name: row.name ?? `员工${batchStart + i + 1}`,
            employeeNo: row.employeeNo ?? `EMP_${Date.now()}_${batchStart + i}`,
            phone: row.phone ?? '13800138000',
            idCard: row.idCard ?? '110101199001011234',
            hireDate: new Date(row.hireDate ?? '2024-01-01'),
            status: 'ACTIVE',
        }));
        try {
            const result = await prisma.employee.createMany({ data: employees, skipDuplicates: true });
            successCount += result.count;
            failCount += batch.length - result.count;
        }
        catch (err) {
            failCount += batch.length;
            errors.push({ batch: batchStart + 1, error: err.message });
        }
        const processed = Math.min(batchStart + BATCH_SIZE, rows.length);
        await updateExcelTaskProgress(taskId, processed, rows.length, successCount, failCount);
    }
    return { successCount, failCount, errors };
}
//# sourceMappingURL=excel.service.js.map