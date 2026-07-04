import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
const SENSITIVE_LEVELS = ['SENSITIVE', 'CONFIDENTIAL'];
const SECOND_PASSWORD_TTL = 10 * 60 * 1000;
export async function checkFileAccess(documentId, context) {
    const doc = await prisma.kbDocument.findUnique({
        where: { id: documentId },
    });
    if (!doc) {
        throw Errors.notFound('文件不存在');
    }
    const level = doc.securityLevel;
    if (level === 'PUBLIC') {
        return { allowed: true };
    }
    if (level === 'INTERNAL') {
        return { allowed: true };
    }
    if (SENSITIVE_LEVELS.includes(level)) {
        if (doc.uploaderId === context.userId) {
            return { allowed: true };
        }
        const allowedUserIds = Array.isArray(doc.allowedUserIds)
            ? doc.allowedUserIds
            : [];
        if (allowedUserIds.includes(context.userId)) {
            return { allowed: true };
        }
        const allowedRoleIds = Array.isArray(doc.allowedRoleIds)
            ? doc.allowedRoleIds
            : [];
        const hasAllowedRole = context.roleIds.some((r) => allowedRoleIds.includes(r));
        if (hasAllowedRole) {
            return { allowed: true };
        }
        return { allowed: false, reason: '无访问权限' };
    }
    if (level === 'CONFIDENTIAL') {
        if (!context.hasSecondPasswordVerified || !context.secondPasswordVerifiedAt) {
            return { allowed: false, reason: '需要验证二级密码' };
        }
        const now = Date.now();
        if (now - context.secondPasswordVerifiedAt > SECOND_PASSWORD_TTL) {
            return { allowed: false, reason: '二级密码验证已过期' };
        }
    }
    return { allowed: true };
}
export async function filterDocumentsByAccess(documents, context) {
    const result = [];
    for (const doc of documents) {
        const access = await checkFileAccess(doc.id, context);
        if (access.allowed) {
            result.push(doc);
        }
    }
    return result;
}
export async function updateDocumentSecurity(documentId, securityLevel, allowedUserIds, allowedRoleIds) {
    const doc = await prisma.kbDocument.findUnique({ where: { id: documentId } });
    if (!doc)
        throw Errors.notFound('文件不存在');
    return prisma.kbDocument.update({
        where: { id: documentId },
        data: {
            securityLevel,
            allowedUserIds,
            allowedRoleIds,
            isConfidential: securityLevel === 'CONFIDENTIAL',
        },
    });
}
export const fileSecurityLevels = [
    { value: 'PUBLIC', label: '公开', description: '任何人可访问' },
    { value: 'INTERNAL', label: '内部', description: '内部员工可访问' },
    { value: 'SENSITIVE', label: '敏感', description: '指定用户/角色可访问' },
    { value: 'CONFIDENTIAL', label: '机密', description: '需要二级密码验证' },
];
//# sourceMappingURL=file-security.service.js.map