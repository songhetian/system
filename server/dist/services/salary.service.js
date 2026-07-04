import { prisma } from '../lib/prisma.js';
/**
 * 计算薪资公式。支持变量替换 `{ITEM_NAME}` 引用前面已计算的薪资项金额。
 * 示例：`{基本工资} * 1.0` → 取「基本工资」项的值
 *        `{基本工资} * 0.105` → 社保 = 基本工资 × 10.5%
 *        `5000` → 固定金额
 */
function evaluateFormula(formula, computedItems) {
    // 替换变量：{变量名} → 数值
    let resolved = formula.replace(/\{([^}]+)\}/g, (_, name) => {
        const found = computedItems.find((i) => i.name === name.trim());
        return found ? String(found.amount) : '0';
    });
    // 安全求值：只允许数字、四则运算、括号、小数点
    const sanitized = resolved.replace(/[^0-9+\-*/().\s]/g, '');
    if (!sanitized.trim())
        return 0;
    try {
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${sanitized})`)();
        return Number(result) || 0;
    }
    catch {
        return 0;
    }
}
export async function createSalaryStructure(data) {
    return prisma.salaryStructure.create({
        data: {
            name: data.name,
            items: data.items,
        },
    });
}
export async function getSalaryStructureById(id) {
    return prisma.salaryStructure.findUnique({ where: { id } });
}
export async function listSalaryStructures(page, pageSize) {
    const [list, total] = await Promise.all([
        prisma.salaryStructure.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
        }),
        prisma.salaryStructure.count(),
    ]);
    return { list, total, page, pageSize };
}
export async function updateSalaryStructure(id, data) {
    return prisma.salaryStructure.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.items !== undefined && { items: data.items }),
        },
    });
}
export async function deleteSalaryStructure(id) {
    await prisma.salaryStructure.delete({ where: { id } });
}
export async function assignSalaryStructure(structureId, employeeIds) {
    const result = await prisma.$transaction(employeeIds.map((employeeId) => prisma.salaryStructureAssignment.upsert({
        where: { employeeId },
        create: { structureId, employeeId },
        update: { structureId },
    })));
    return { count: result.length };
}
export async function generatePayslips(data) {
    const { year, month, departmentId } = data;
    const employees = await prisma.employee.findMany({
        where: {
            deletedAt: null,
            ...(departmentId && {
                employeePositions: {
                    some: {
                        position: { departmentId },
                    },
                },
            }),
        },
        include: {
            employeePositions: {
                include: { position: { include: { department: true } } },
                orderBy: { startDate: 'desc' },
                take: 1,
            },
        },
    });
    const assignments = await prisma.salaryStructureAssignment.findMany({
        where: { employeeId: { in: employees.map((e) => e.id) } },
        include: { structure: true },
    });
    const payslipData = [];
    for (const assignment of assignments) {
        const employee = employees.find((e) => e.id === assignment.employeeId);
        if (!employee)
            continue;
        const structure = assignment.structure;
        const structureItems = structure.items;
        let grossPay = 0;
        let deductions = 0;
        const payslipItems = [];
        for (const item of structureItems) {
            const amount = evaluateFormula(item.formula, payslipItems);
            payslipItems.push({ type: item.type, name: item.name, amount: Math.abs(amount) });
            if (['INSURANCE', 'TAX', 'DEDUCTION'].includes(item.type)) {
                deductions += Math.abs(amount);
            }
            else {
                grossPay += Math.abs(amount);
            }
        }
        const netPay = grossPay - deductions;
        const dept = employee.employeePositions[0]?.position?.department;
        payslipData.push({
            employeeId: employee.id,
            employeeName: employee.name,
            departmentId: dept?.id ?? null,
            departmentName: dept?.name ?? '未知部门',
            positionName: employee.employeePositions[0]?.position?.name ?? '未知岗位',
            year,
            month,
            items: payslipItems,
            grossPay,
            deductions,
            netPay,
        });
    }
    if (payslipData.length === 0) {
        return { count: 0 };
    }
    const result = await prisma.payslip.createMany({
        data: payslipData,
        skipDuplicates: true,
    });
    return { count: result.count };
}
export async function listPayslips(query) {
    const { page = 1, pageSize = 10, year, month, departmentId, employeeId } = query;
    const where = {};
    if (year)
        where.year = year;
    if (month)
        where.month = month;
    if (departmentId)
        where.departmentId = departmentId;
    if (employeeId)
        where.employeeId = employeeId;
    const [list, total] = await Promise.all([
        prisma.payslip.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        }),
        prisma.payslip.count({ where }),
    ]);
    return { list, total, page, pageSize };
}
export async function getPayslipById(id) {
    return prisma.payslip.findUnique({ where: { id } });
}
export async function listSalaryAuditLogs(query) {
    const { page = 1, pageSize = 10, userId, action, dateFrom, dateTo } = query;
    const where = {};
    if (userId)
        where.userId = userId;
    if (action)
        where.action = action;
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom)
            where.createdAt.gte = new Date(dateFrom);
        if (dateTo)
            where.createdAt.lte = new Date(dateTo);
    }
    const [list, total] = await Promise.all([
        prisma.salaryAuditLog.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ createdAt: 'desc' }],
            include: { user: { select: { username: true } } },
        }),
        prisma.salaryAuditLog.count({ where }),
    ]);
    const listWithUsername = list.map((log) => ({
        ...log,
        username: log.user?.username || 'unknown',
        user: undefined,
    }));
    return { list: listWithUsername, total, page, pageSize };
}
//# sourceMappingURL=salary.service.js.map