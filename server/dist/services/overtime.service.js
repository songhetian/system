import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { createWorkflowInstance } from './workflow.service.js';
export async function createOvertimeRequest(data) {
    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);
    if (start >= end) {
        throw Errors.validation('结束时间必须大于开始时间');
    }
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const request = await prisma.overtimeRequest.create({
        data: {
            employeeId: data.employeeId,
            type: data.type,
            startDateTime: start,
            endDateTime: end,
            reason: data.reason,
            approvedHours: hours,
        },
    });
    // 自动启动审批流（如果有对应模板）
    if (data.workflowTemplateId) {
        const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
        const instance = await createWorkflowInstance({
            templateId: data.workflowTemplateId,
            subject: `${emp?.name || '员工'}加班申请`,
            formData: { type: data.type, hours, reason: data.reason },
            sourceType: 'OVERTIME',
            sourceId: request.id,
            applicantId: data.employeeId,
            applicantName: emp?.name || '',
        });
        await prisma.overtimeRequest.update({
            where: { id: request.id },
            data: { workflowInstanceId: instance.id },
        });
        return prisma.overtimeRequest.findUnique({ where: { id: request.id } });
    }
    return request;
}
export async function listOvertimeRequests(query) {
    const { page = 1, pageSize = 10, employeeId, status, type } = query;
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    if (status)
        where.status = status;
    if (type)
        where.type = type;
    const [total, items] = await Promise.all([
        prisma.overtimeRequest.count({ where }),
        prisma.overtimeRequest.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    return { total, items };
}
export async function getOvertimeRequest(id) {
    const request = await prisma.overtimeRequest.findUnique({ where: { id } });
    if (!request)
        throw Errors.notFound('加班申请不存在');
    return request;
}
export async function updateOvertimeRequest(id, data) {
    const request = await getOvertimeRequest(id);
    if (request.status !== 'PENDING') {
        throw Errors.business('只能修改待审批状态的申请');
    }
    const updateData = {};
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.reason !== undefined)
        updateData.reason = data.reason;
    if (data.startDateTime !== undefined) {
        updateData.startDateTime = new Date(data.startDateTime);
    }
    if (data.endDateTime !== undefined) {
        updateData.endDateTime = new Date(data.endDateTime);
    }
    if (updateData.startDateTime && updateData.endDateTime) {
        const hours = (updateData.endDateTime.getTime() - updateData.startDateTime.getTime()) / (1000 * 60 * 60);
        updateData.approvedHours = hours;
    }
    return prisma.overtimeRequest.update({ where: { id }, data: updateData });
}
export async function approveOvertimeRequest(id, approvedHours) {
    const request = await getOvertimeRequest(id);
    if (request.status !== 'PENDING') {
        throw Errors.business('只能审批待审批状态的申请');
    }
    const hours = approvedHours ?? request.approvedHours;
    await prisma.$transaction(async (tx) => {
        await tx.overtimeRequest.update({
            where: { id },
            data: { status: 'APPROVED', approvedHours: hours },
        });
        const year = new Date().getFullYear();
        let quota = await tx.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId: request.employeeId, year } },
        });
        if (!quota) {
            quota = await tx.leaveQuota.create({
                data: { employeeId: request.employeeId, year },
            });
        }
        await tx.leaveQuota.update({
            where: { id: quota.id },
            data: { compensatoryBalance: { increment: hours } },
        });
    });
    return prisma.overtimeRequest.findUnique({ where: { id } });
}
export async function rejectOvertimeRequest(id, reason) {
    const request = await getOvertimeRequest(id);
    if (request.status !== 'PENDING') {
        throw Errors.business('只能拒绝待审批状态的申请');
    }
    return prisma.overtimeRequest.update({
        where: { id },
        data: { status: 'REJECTED', rejectReason: reason || null },
    });
}
export async function cancelOvertimeRequest(id) {
    const request = await getOvertimeRequest(id);
    if (request.status !== 'PENDING') {
        throw Errors.business('只能取消待审批状态的申请');
    }
    return prisma.overtimeRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
    });
}
export async function createOvertimeRecord(data) {
    const request = await getOvertimeRequest(data.requestId);
    if (request.status !== 'APPROVED') {
        throw Errors.business('只能为已审批的加班申请创建记录');
    }
    return prisma.overtimeRecord.create({
        data: {
            requestId: data.requestId,
            employeeId: request.employeeId,
            actualStart: new Date(data.actualStart),
            actualEnd: new Date(data.actualEnd),
            durationHours: data.durationHours,
            compensatoryHours: data.compensatoryHours,
        },
    });
}
export async function listOvertimeRecords(employeeId, requestId) {
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    if (requestId)
        where.requestId = requestId;
    return prisma.overtimeRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=overtime.service.js.map