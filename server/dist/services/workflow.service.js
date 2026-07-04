import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { sendNotification } from '../plugins/websocket.js';
const callbacks = new Map();
export function registerWorkflowCallback(sourceType, cb) {
    callbacks.set(sourceType, cb);
}
export async function getWorkflowTemplateBySourceType(sourceType) {
    return prisma.workflowTemplate.findFirst({
        where: { sourceType, status: 'PUBLISHED', deletedAt: null },
        orderBy: { version: 'desc' },
    });
}
export async function createWorkflowTemplate(data) {
    return prisma.workflowTemplate.create({
        data: {
            name: data.name,
            description: data.description,
            nodes: data.nodes,
            edges: data.edges,
        },
    });
}
export async function getWorkflowTemplateById(id) {
    return prisma.workflowTemplate.findUnique({
        where: { id, deletedAt: null },
    });
}
export async function listWorkflowTemplates(page, pageSize) {
    const where = { deletedAt: null };
    const [list, total] = await Promise.all([
        prisma.workflowTemplate.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
        }),
        prisma.workflowTemplate.count({ where }),
    ]);
    return { list, total, page, pageSize };
}
export async function updateWorkflowTemplate(id, data) {
    return prisma.workflowTemplate.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.nodes !== undefined && { nodes: data.nodes }),
            ...(data.edges !== undefined && { edges: data.edges }),
        },
    });
}
export async function deleteWorkflowTemplate(id) {
    await prisma.workflowTemplate.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
export async function publishWorkflowTemplate(id) {
    return prisma.workflowTemplate.update({
        where: { id },
        data: { status: 'PUBLISHED' },
    });
}
// ─── 审批实例 ─────────────────────────────────────────────────
async function resolveAssignee(tx, node, applicantId) {
    if (node.assigneeType === 'DEPARTMENT_LEADER') {
        const user = await tx.user.findUnique({
            where: { id: applicantId },
            include: {
                employee: {
                    include: {
                        employeePositions: {
                            where: { endDate: null },
                            include: { position: { include: { department: true } } },
                            take: 1,
                        },
                    },
                },
            },
        });
        const dept = user?.employee?.employeePositions?.[0]?.position?.department;
        if (dept?.managerId) {
            const manager = await tx.employee.findUnique({ where: { id: dept.managerId } });
            return { assigneeId: manager?.id ?? null, assigneeName: manager?.name ?? null };
        }
        return { assigneeId: null, assigneeName: null };
    }
    if (node.assigneeType === 'SUPERVISOR') {
        const user = await tx.user.findUnique({
            where: { id: applicantId },
            include: { employee: { include: { supervisor: true } } },
        });
        const supervisor = user?.employee?.supervisor;
        if (supervisor) {
            return { assigneeId: supervisor.id, assigneeName: supervisor.name };
        }
        return { assigneeId: null, assigneeName: null };
    }
    if (node.assigneeType === 'USER' && node.assigneeId) {
        const targetUser = await tx.user.findUnique({
            where: { id: node.assigneeId },
            include: { employee: true },
        });
        return { assigneeId: node.assigneeId, assigneeName: targetUser?.employee?.name ?? null };
    }
    return { assigneeId: node.assigneeId ?? null, assigneeName: null };
}
export async function createWorkflowInstance(data) {
    const template = await prisma.workflowTemplate.findUnique({
        where: { id: data.templateId, status: 'PUBLISHED' },
    });
    if (!template)
        throw Errors.notFound('模板不存在或未发布');
    const applicantId = data.applicantId ?? 1;
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: applicantId },
            include: { employee: true },
        });
        const applicantName = user?.employee?.name ?? '测试用户';
        const instance = await tx.workflowInstance.create({
            data: {
                templateId: data.templateId,
                templateName: template.name,
                subject: data.subject,
                formData: data.formData,
                sourceType: data.sourceType,
                sourceId: data.sourceId,
                applicantId,
                applicantName,
                status: 'IN_PROGRESS',
            },
        });
        const nodes = template.nodes;
        const nodeData = [];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const resolved = await resolveAssignee(tx, node, applicantId);
            nodeData.push({
                instanceId: instance.id,
                nodeIndex: i,
                type: node.type,
                label: node.label,
                ...(node.assigneeType && { assigneeType: node.assigneeType }),
                ...(resolved.assigneeId !== undefined && resolved.assigneeId !== null && { assigneeId: resolved.assigneeId }),
                ...(resolved.assigneeName && { assigneeName: resolved.assigneeName }),
                ...(node.signType && { signType: node.signType }),
                status: node.type === 'START' ? 'APPROVED' : 'PENDING',
            });
        }
        await tx.workflowInstanceNode.createMany({ data: nodeData });
        return instance;
    });
}
export async function getWorkflowInstanceById(id) {
    return prisma.workflowInstance.findUnique({
        where: { id },
        include: { nodes: { orderBy: { nodeIndex: 'asc' } } },
    });
}
export async function listWorkflowInstances(page, pageSize) {
    const [list, total] = await Promise.all([
        prisma.workflowInstance.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
        }),
        prisma.workflowInstance.count(),
    ]);
    return { list, total, page, pageSize };
}
export async function approveWorkflowInstance(id, comment) {
    return prisma.$transaction(async (tx) => {
        // ponytail: Prisma 5.22 不支持 findUnique.lock，用原生 FOR UPDATE 手动加行锁防止并发审批
        const [locked] = await tx.$queryRawUnsafe(`SELECT id FROM WorkflowInstance WHERE id = ? FOR UPDATE`, id);
        if (!locked)
            throw Errors.notFound('实例不存在');
        const instance = await tx.workflowInstance.findUnique({
            where: { id },
            include: { nodes: { orderBy: { nodeIndex: 'asc' } } },
        });
        if (!instance)
            throw Errors.notFound('实例不存在');
        if (instance.status !== 'IN_PROGRESS') {
            throw Errors.business('审批已结束，无法重复操作');
        }
        const pendingNode = instance.nodes.find((n) => n.type === 'APPROVAL' && n.status === 'PENDING');
        if (!pendingNode)
            throw Errors.business('没有待审批节点');
        await tx.workflowInstanceNode.update({
            where: { id: pendingNode.id },
            data: { status: 'APPROVED', comment, operatedAt: new Date() },
        });
        const remainingPending = await tx.workflowInstanceNode.count({
            where: { instanceId: id, type: 'APPROVAL', status: 'PENDING' },
        });
        const newStatus = remainingPending === 0 ? 'APPROVED' : 'IN_PROGRESS';
        await tx.workflowInstance.update({
            where: { id },
            data: { status: newStatus },
        });
        if (newStatus === 'APPROVED') {
            await updateSourceDocumentStatus(tx, instance.sourceType, instance.sourceId, 'APPROVED');
            // 调用业务模块注册的审批通过回调（如扣额度等）
            const cb = callbacks.get(instance.sourceType);
            if (cb?.onApproved) {
                await cb.onApproved(instance.sourceId, tx);
            }
            await sendNotification(instance.applicantId, {
                type: 'workflow',
                title: '审批通过',
                content: `您的审批申请「${instance.subject}」已全部通过`,
                data: { instanceId: id, sourceType: instance.sourceType, sourceId: instance.sourceId },
            });
        }
        else {
            const nextPending = instance.nodes.find((n, i) => i > pendingNode.nodeIndex && n.type === 'APPROVAL' && n.status === 'PENDING');
            if (nextPending?.assigneeId) {
                await sendNotification(nextPending.assigneeId, {
                    type: 'workflow',
                    title: '待审批',
                    content: `有新的审批任务「${instance.subject}」需要处理`,
                    data: { instanceId: id, nodeIndex: nextPending.nodeIndex },
                });
            }
        }
        return tx.workflowInstance.findUnique({ where: { id } });
    });
}
export async function rejectWorkflowInstance(id, reason) {
    return prisma.$transaction(async (tx) => {
        // ponytail: Prisma 5.22 不支持 findUnique.lock，用原生 FOR UPDATE 手动加行锁
        const [locked] = await tx.$queryRawUnsafe(`SELECT id FROM WorkflowInstance WHERE id = ? FOR UPDATE`, id);
        if (!locked)
            throw Errors.notFound('实例不存在');
        const instance = await tx.workflowInstance.findUnique({
            where: { id },
            include: { nodes: { orderBy: { nodeIndex: 'asc' } } },
        });
        if (!instance)
            throw Errors.notFound('实例不存在');
        if (instance.status !== 'IN_PROGRESS') {
            throw Errors.business('审批已结束，无法重复操作');
        }
        const pendingNode = instance.nodes.find((n) => n.type === 'APPROVAL' && n.status === 'PENDING');
        if (!pendingNode)
            throw Errors.business('没有待审批节点');
        await tx.workflowInstanceNode.update({
            where: { id: pendingNode.id },
            data: { status: 'REJECTED', comment: reason, operatedAt: new Date() },
        });
        await tx.workflowInstance.update({
            where: { id },
            data: { status: 'REJECTED' },
        });
        await updateSourceDocumentStatus(tx, instance.sourceType, instance.sourceId, 'REJECTED');
        // 调用业务模块注册的审批驳回回调
        const cb = callbacks.get(instance.sourceType);
        if (cb?.onRejected) {
            await cb.onRejected(instance.sourceId, tx, reason);
        }
        await sendNotification(instance.applicantId, {
            type: 'workflow',
            title: '审批拒绝',
            content: `您的审批申请「${instance.subject}」被拒绝，原因：${reason}`,
            data: { instanceId: id, sourceType: instance.sourceType, sourceId: instance.sourceId },
        });
        return tx.workflowInstance.findUnique({ where: { id } });
    });
}
async function updateSourceDocumentStatus(tx, sourceType, sourceId, status) {
    if (!sourceId || sourceId === 0)
        return;
    switch (sourceType) {
        case 'LEAVE':
            await tx.leaveRequest.update({
                where: { id: sourceId },
                data: { status },
            });
            break;
        case 'EXPENSE':
            await tx.expenseClaim.update({
                where: { id: sourceId },
                data: { status },
            });
            break;
        case 'OVERTIME':
            await tx.overtimeRequest.update({
                where: { id: sourceId },
                data: { status },
            });
            break;
    }
}
export async function evaluateCondition(formData, config, applicantId) {
    switch (config.type) {
        case 'AMOUNT_THRESHOLD': {
            const amount = Number(formData.amount || 0);
            const threshold = Number(config.value);
            const operator = config.operator || '>';
            return compareValues(amount, operator, threshold);
        }
        case 'DEPARTMENT': {
            const user = await prisma.user.findUnique({
                where: { id: applicantId },
                include: {
                    employee: {
                        include: {
                            employeePositions: {
                                include: { position: true },
                                where: { endDate: null },
                            },
                        },
                    },
                },
            });
            const deptId = user?.employee?.employeePositions?.[0]?.position?.departmentId;
            const targetDepts = Array.isArray(config.value) ? config.value : [config.value];
            return deptId ? targetDepts.includes(deptId) : false;
        }
        case 'POSITION': {
            const user = await prisma.user.findUnique({
                where: { id: applicantId },
                include: {
                    employee: {
                        include: {
                            employeePositions: {
                                include: { position: true },
                                where: { endDate: null },
                            },
                        },
                    },
                },
            });
            const posId = user?.employee?.employeePositions?.[0]?.positionId;
            const targetPositions = Array.isArray(config.value) ? config.value : [config.value];
            return posId ? targetPositions.includes(posId) : false;
        }
        case 'LEAVE_DAYS': {
            const leaveDays = Number(formData.leaveDays || formData.days || 0);
            const threshold = Number(config.value);
            const operator = config.operator || '>';
            return compareValues(leaveDays, operator, threshold);
        }
        case 'EMPLOYEE_TYPE': {
            const user = await prisma.user.findUnique({
                where: { id: applicantId },
                include: { employee: true },
            });
            const empStatus = user?.employee?.status;
            const targetTypes = Array.isArray(config.value) ? config.value : [config.value];
            return empStatus ? targetTypes.includes(empStatus) : false;
        }
        default:
            return false;
    }
}
function compareValues(left, operator, right) {
    switch (operator) {
        case '>':
            return left > right;
        case '>=':
            return left >= right;
        case '<':
            return left < right;
        case '<=':
            return left <= right;
        case '==':
        case '===':
            return left === right;
        case '!=':
        case '!==':
            return left !== right;
        default:
            return false;
    }
}
export async function returnWorkflowInstance(id, targetType, reason, targetNodeIndex) {
    return prisma.$transaction(async (tx) => {
        // ponytail: 退回也需要行锁，防止与 approve/reject 并发
        const [locked] = await tx.$queryRawUnsafe(`SELECT id FROM WorkflowInstance WHERE id = ? FOR UPDATE`, id);
        if (!locked)
            throw Errors.notFound('实例不存在');
        const instance = await tx.workflowInstance.findUnique({
            where: { id },
            include: { nodes: { orderBy: { nodeIndex: 'asc' } } },
        });
        if (!instance)
            throw Errors.notFound('实例不存在');
        const currentPendingIndex = instance.nodes.findIndex((n) => n.type === 'APPROVAL' && n.status === 'PENDING');
        if (currentPendingIndex === -1)
            throw Errors.business('没有待审批节点');
        const currentNode = instance.nodes[currentPendingIndex];
        let returnToIndex = 0;
        if (targetType === 'PREVIOUS') {
            const prevApprovalIndex = instance.nodes
                .slice(0, currentPendingIndex)
                .map((n, i) => ({ ...n, origIndex: i }))
                .filter((n) => n.type === 'APPROVAL')
                .reverse()[0]?.origIndex;
            returnToIndex = prevApprovalIndex ?? 0;
        }
        else if (targetType === 'START') {
            returnToIndex = 0;
        }
        else if (targetType === 'SPECIFIED') {
            if (targetNodeIndex === undefined)
                throw Errors.validation('必须指定退回节点');
            const targetNode = instance.nodes[targetNodeIndex];
            if (!targetNode || targetNode.type !== 'APPROVAL') {
                throw Errors.validation('目标节点不存在或不是审批节点');
            }
            returnToIndex = targetNodeIndex;
        }
        await tx.workflowInstanceNode.update({
            where: { id: currentNode.id },
            data: {
                status: 'REJECTED',
                comment: reason,
                operatedAt: new Date(),
                returnedToIndex: returnToIndex,
            },
        });
        for (let i = returnToIndex; i < currentPendingIndex; i++) {
            const node = instance.nodes[i];
            if (node.type === 'APPROVAL' && node.status === 'APPROVED') {
                await tx.workflowInstanceNode.update({
                    where: { id: node.id },
                    data: {
                        status: 'PENDING',
                        returnedFromIndex: currentPendingIndex,
                    },
                });
                if (node.assigneeId) {
                    await sendNotification(node.assigneeId, {
                        type: 'workflow',
                        title: '审批退回',
                        content: `您审批过的申请「${instance.subject}」已被退回，需要重新审批`,
                        data: { instanceId: id, nodeIndex: i },
                    });
                }
            }
        }
        await sendNotification(instance.applicantId, {
            type: 'workflow',
            title: '审批退回',
            content: `您的审批申请「${instance.subject}」已被退回修改，原因：${reason}`,
            data: { instanceId: id, sourceType: instance.sourceType, sourceId: instance.sourceId },
        });
        return tx.workflowInstance.findUnique({
            where: { id },
            include: { nodes: { orderBy: { nodeIndex: 'asc' } } },
        });
    });
}
//# sourceMappingURL=workflow.service.js.map