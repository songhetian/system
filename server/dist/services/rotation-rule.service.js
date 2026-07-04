import { prisma } from '../lib/prisma.js';
export class RotationRuleError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}
export async function createRotationRule(data) {
    if (data.pattern.length !== data.cycleDays) {
        throw new RotationRuleError(`pattern 长度 (${data.pattern.length}) 必须等于 cycleDays (${data.cycleDays})`, 30101, 400);
    }
    try {
        return await prisma.rotationRule.create({ data });
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            throw new RotationRuleError('轮班规则名称已存在', 30102, 400);
        }
        throw new RotationRuleError('创建轮班规则失败', 30103, 500);
    }
}
export async function findAllRotationRules() {
    return await prisma.rotationRule.findMany({
        orderBy: { createdAt: 'desc' },
    });
}
export async function findRotationRuleById(id) {
    return await prisma.rotationRule.findUnique({ where: { id } });
}
export async function updateRotationRule(id, data) {
    if (data.pattern !== undefined && data.cycleDays !== undefined) {
        if (data.pattern.length !== data.cycleDays) {
            throw new RotationRuleError(`pattern 长度 (${data.pattern.length}) 必须等于 cycleDays (${data.cycleDays})`, 30101, 400);
        }
    }
    try {
        return await prisma.rotationRule.update({
            where: { id },
            data,
        });
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            throw new RotationRuleError('轮班规则名称已存在', 30102, 400);
        }
        if (error.code === 'P2025') {
            throw new RotationRuleError('轮班规则不存在', 30104, 404);
        }
        throw new RotationRuleError('更新轮班规则失败', 30105, 500);
    }
}
export async function deleteRotationRule(id) {
    try {
        await prisma.rotationRule.delete({ where: { id } });
        return true;
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new RotationRuleError('轮班规则不存在', 30104, 404);
        }
        throw new RotationRuleError('删除轮班规则失败', 30106, 500);
    }
}
//# sourceMappingURL=rotation-rule.service.js.map