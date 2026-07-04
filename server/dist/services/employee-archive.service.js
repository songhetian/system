import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
export async function createEmployeeContract(data) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start >= end) {
        throw Errors.validation('结束日期必须大于开始日期');
    }
    return prisma.employeeContract.create({
        data: {
            employeeId: data.employeeId,
            type: data.type,
            startDate: start,
            endDate: end,
            probationEndDate: data.probationEndDate ? new Date(data.probationEndDate) : null,
            salary: data.salary,
            filePath: data.filePath,
            fileName: data.fileName,
            remark: data.remark,
        },
    });
}
export async function listEmployeeContracts(employeeId, status) {
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    if (status)
        where.status = status;
    return prisma.employeeContract.findMany({
        where,
        orderBy: { startDate: 'desc' },
    });
}
export async function getEmployeeContract(id) {
    const contract = await prisma.employeeContract.findUnique({ where: { id } });
    if (!contract)
        throw Errors.notFound('合同不存在');
    return contract;
}
export async function updateEmployeeContract(id, data) {
    await getEmployeeContract(id);
    const updateData = {};
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.endDate !== undefined)
        updateData.endDate = new Date(data.endDate);
    if (data.salary !== undefined)
        updateData.salary = data.salary;
    if (data.filePath !== undefined)
        updateData.filePath = data.filePath;
    if (data.fileName !== undefined)
        updateData.fileName = data.fileName;
    if (data.remark !== undefined)
        updateData.remark = data.remark;
    return prisma.employeeContract.update({ where: { id }, data: updateData });
}
export async function terminateEmployeeContract(id, reason) {
    const contract = await getEmployeeContract(id);
    if (contract.status !== 'ACTIVE') {
        throw Errors.business('只能终止生效中的合同');
    }
    return prisma.employeeContract.update({
        where: { id },
        data: { status: 'TERMINATED', remark: reason },
    });
}
export async function createEmployeeDocument(data) {
    return prisma.employeeDocument.create({
        data: {
            employeeId: data.employeeId,
            type: data.type,
            filePath: data.filePath,
            fileName: data.fileName,
            fileSize: data.fileSize,
            verified: data.verified,
            remark: data.remark,
        },
    });
}
export async function listEmployeeDocuments(employeeId, type) {
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    if (type)
        where.type = type;
    return prisma.employeeDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
}
export async function getEmployeeDocument(id) {
    const doc = await prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc)
        throw Errors.notFound('证件不存在');
    return doc;
}
export async function verifyEmployeeDocument(id, verified) {
    await getEmployeeDocument(id);
    return prisma.employeeDocument.update({
        where: { id },
        data: { verified },
    });
}
export async function deleteEmployeeDocument(id) {
    await getEmployeeDocument(id);
    return prisma.employeeDocument.delete({ where: { id } });
}
export async function createEmployeeEvent(data) {
    return prisma.employeeEvent.create({
        data: {
            employeeId: data.employeeId,
            type: data.type,
            title: data.title,
            description: data.description,
            oldDepartmentId: data.oldDepartmentId,
            newDepartmentId: data.newDepartmentId,
            oldPositionId: data.oldPositionId,
            newPositionId: data.newPositionId,
            oldRankId: data.oldRankId,
            newRankId: data.newRankId,
            effectiveDate: new Date(data.effectiveDate),
            operatorId: data.operatorId,
            operatorName: data.operatorName,
        },
    });
}
export async function listEmployeeEvents(employeeId, type) {
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    if (type)
        where.type = type;
    return prisma.employeeEvent.findMany({
        where,
        orderBy: { effectiveDate: 'desc' },
    });
}
export async function getEmployeeEvent(id) {
    const event = await prisma.employeeEvent.findUnique({
        where: { id },
    });
    if (!event)
        throw Errors.notFound('履历记录不存在');
    return event;
}
export async function getEmployeeArchive(employeeId) {
    const [contracts, documents, events] = await Promise.all([
        listEmployeeContracts(employeeId),
        listEmployeeDocuments(employeeId),
        listEmployeeEvents(employeeId),
    ]);
    return { contracts, documents, events };
}
//# sourceMappingURL=employee-archive.service.js.map