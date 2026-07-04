import { prisma } from '../lib/prisma.js';
import { deductLeaveQuota } from './leave-quota.service.js';
import { createWorkflowInstance, getWorkflowTemplateBySourceType, registerWorkflowCallback, } from './workflow.service.js';
// ponytail: 注册审批流回调，审批通过后扣减假期额度
registerWorkflowCallback('LEAVE', {
    onApproved: async (sourceId, tx) => {
        const request = await tx.leaveRequest.findUnique({ where: { id: sourceId } });
        if (!request || request.status !== 'APPROVED')
            return;
        const days = calculateLeaveDays(request.startDate.toISOString().slice(0, 10), request.endDate.toISOString().slice(0, 10), request.startTime, request.endTime);
        await deductLeaveQuota({
            employeeId: request.employeeId,
            year: new Date(request.startDate).getFullYear(),
            type: request.type,
            days,
        }, tx);
    },
});
export class LeaveRequestError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}
function calculateLeaveDays(startDate, endDate, startTime, endTime) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (startDate === endDate) {
        if (startTime === 'ALL' || endTime === 'ALL') {
            return 1;
        }
        if (startTime === 'AM' && endTime === 'PM') {
            return 1;
        }
        return 0.5;
    }
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    let adjust = 0;
    if (startTime === 'PM')
        adjust += 0.5;
    if (endTime === 'AM')
        adjust += 0.5;
    return diffDays - adjust;
}
export async function createLeaveRequest(data) {
    const { employeeId, type, startDate, endDate, startTime, endTime, reason } = data;
    const days = calculateLeaveDays(startDate, endDate, startTime, endTime);
    const year = new Date(startDate).getFullYear();
    if (type === 'ANNUAL' || type === 'COMPENSATORY') {
        const quota = await prisma.leaveQuota.findUnique({
            where: { employeeId_year: { employeeId, year } },
        });
        if (!quota) {
            throw new LeaveRequestError('假期额度不存在', 30001, 404);
        }
        const balance = type === 'ANNUAL' ? quota.annualBalance : quota.compensatoryBalance;
        if (balance < days) {
            throw new LeaveRequestError('假期余额不足', 30002, 400);
        }
    }
    const request = await prisma.leaveRequest.create({
        data: {
            ...data,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        },
    });
    // 自动启动审批流（如果有对应模板）
    const template = await getWorkflowTemplateBySourceType('LEAVE');
    if (template) {
        const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
        await createWorkflowInstance({
            templateId: template.id,
            subject: `${emp?.name || '员工'}请假申请 - ${type}`,
            formData: { leaveRequestId: request.id, type, days },
            sourceType: 'LEAVE',
            sourceId: request.id,
            applicantId: employeeId,
        });
    }
    return request;
}
export async function findLeaveRequestByFilter(params, extraWhere) {
    const { page = 1, pageSize = 10, status, employeeId, departmentId, dateFrom, dateTo } = params;
    const where = {};
    if (status !== undefined) {
        where.status = status;
    }
    if (employeeId !== undefined) {
        where.employeeId = employeeId;
    }
    if (departmentId !== undefined) {
        where.employee = {
            employeePositions: {
                some: {
                    position: {
                        departmentId,
                    },
                },
            },
        };
    }
    if (dateFrom !== undefined) {
        where.startDate = { gte: new Date(dateFrom) };
    }
    if (dateTo !== undefined) {
        where.endDate = { lte: new Date(dateTo) };
    }
    // 合并额外的 where 条件（如行级权限过滤）
    if (extraWhere) {
        Object.assign(where, extraWhere);
    }
    const [list, total] = await Promise.all([
        prisma.leaveRequest.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.leaveRequest.count({ where }),
    ]);
    return {
        list,
        total,
        page,
        pageSize,
    };
}
export async function findLeaveRequestById(id) {
    const request = await prisma.leaveRequest.findUnique({
        where: { id },
    });
    if (!request) {
        throw new LeaveRequestError('请假申请不存在', 30003, 404);
    }
    const approvalChain = await prisma.approvalChain.findUnique({
        where: { instanceId: id },
    });
    return {
        ...request,
        approvalChain: approvalChain ? JSON.parse(approvalChain.nodes) : null,
    };
}
export async function updateLeaveRequest(id, data) {
    const request = await prisma.leaveRequest.findUnique({
        where: { id },
    });
    if (!request) {
        throw new LeaveRequestError('请假申请不存在', 30003, 404);
    }
    if (request.status !== 'PENDING') {
        throw new LeaveRequestError('只能修改待审批的申请', 30004, 400);
    }
    const updateData = {};
    if (data.type !== undefined)
        updateData.type = data.type;
    if (data.startDate !== undefined)
        updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
        updateData.endDate = new Date(data.endDate);
    if (data.startTime !== undefined)
        updateData.startTime = data.startTime;
    if (data.endTime !== undefined)
        updateData.endTime = data.endTime;
    if (data.reason !== undefined)
        updateData.reason = data.reason;
    if (data.attachments !== undefined)
        updateData.attachments = data.attachments;
    const updated = await prisma.leaveRequest.update({
        where: { id },
        data: updateData,
    });
    return updated;
}
export async function approveLeaveRequest(id, data) {
    return prisma.$transaction(async (tx) => {
        // ponytail: 先锁 leaveRequest 行，防止并发重复审批
        const [locked] = await tx.$queryRawUnsafe(`SELECT id, status FROM LeaveRequest WHERE id = ? FOR UPDATE`, id);
        if (!locked) {
            throw new LeaveRequestError('请假申请不存在', 30003, 404);
        }
        if (locked.status !== 'PENDING') {
            throw new LeaveRequestError('只能审批待审批的申请', 30005, 400);
        }
        const request = await tx.leaveRequest.findUnique({ where: { id } });
        const days = calculateLeaveDays(request.startDate.toISOString().split('T')[0], request.endDate.toISOString().split('T')[0], request.startTime, request.endTime);
        const year = request.startDate.getFullYear();
        const typeMap = {
            ANNUAL: 'annual',
            SICK: 'sick',
            PERSONAL: 'personal',
            COMPENSATORY: 'compensatory',
        };
        const typeKey = typeMap[request.type];
        if (typeKey) {
            // 行级锁额度记录，防止并发扣减超扣
            const [quota] = await tx.$queryRawUnsafe(`SELECT id FROM LeaveQuota WHERE employeeId = ? AND year = ? FOR UPDATE`, request.employeeId, year);
            if (!quota) {
                throw new LeaveRequestError('假期额度不存在', 30001, 404);
            }
            const balanceField = `${typeKey}Balance`;
            const usedField = `${typeKey}Used`;
            const quotaRecord = await tx.leaveQuota.findUnique({
                where: { employeeId_year: { employeeId: request.employeeId, year } },
            });
            if (request.type === 'ANNUAL' || request.type === 'COMPENSATORY') {
                const balance = quotaRecord[balanceField];
                if (balance < days) {
                    throw new LeaveRequestError('假期余额不足', 30002, 400);
                }
            }
            const updateData = {};
            updateData[balanceField] = { decrement: days };
            updateData[usedField] = { increment: days };
            await tx.leaveQuota.update({
                where: { id: quotaRecord.id },
                data: updateData,
            });
        }
        const updated = await tx.leaveRequest.update({
            where: { id },
            data: { status: 'APPROVED' },
        });
        return updated;
    });
}
export async function rejectLeaveRequest(id, data) {
    const request = await prisma.leaveRequest.findUnique({
        where: { id },
    });
    if (!request) {
        throw new LeaveRequestError('请假申请不存在', 30003, 404);
    }
    if (request.status !== 'PENDING') {
        throw new LeaveRequestError('只能拒绝待审批的申请', 30005, 400);
    }
    const updated = await prisma.leaveRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
    });
    return updated;
}
export async function cancelLeaveRequest(id) {
    const request = await prisma.leaveRequest.findUnique({
        where: { id },
    });
    if (!request) {
        throw new LeaveRequestError('请假申请不存在', 30003, 404);
    }
    if (request.status !== 'PENDING') {
        throw new LeaveRequestError('只能取消待审批的申请', 30004, 400);
    }
    const updated = await prisma.leaveRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
    });
    return updated;
}
//# sourceMappingURL=leave-request.service.js.map