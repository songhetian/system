import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
export async function createScheduleTemplateFromHistory(input) {
    const { sourceStartDate, sourceEndDate, sourceEmployees, name, departmentId, description, creatorId, creatorName } = input;
    if (sourceEmployees.length === 0) {
        throw Errors.validation('至少选择一名员工作为模板来源');
    }
    const schedules = await prisma.schedule.findMany({
        where: {
            employeeId: { in: sourceEmployees },
            date: { gte: sourceStartDate, lte: sourceEndDate },
        },
        orderBy: { date: 'asc' },
        include: { shiftTemplate: true },
    });
    if (schedules.length === 0) {
        throw Errors.business('所选时间段内没有排班数据');
    }
    const firstDate = new Date(sourceStartDate);
    const lastDate = new Date(sourceEndDate);
    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const referenceEmployeeId = sourceEmployees[0];
    const pattern = [];
    for (let d = 0; d < totalDays; d++) {
        const date = new Date(firstDate);
        date.setDate(date.getDate() + d);
        date.setHours(0, 0, 0, 0);
        const sched = schedules.find((s) => s.employeeId === referenceEmployeeId &&
            s.date.getTime() === date.getTime());
        if (sched) {
            pattern.push({
                dayOffset: d,
                shiftTemplateId: sched.shiftTemplateId,
            });
        }
    }
    const template = await prisma.scheduleTemplate.create({
        data: {
            name,
            departmentId,
            description,
            pattern,
            sourceStartDate: firstDate,
            sourceEndDate: lastDate,
            totalDays,
            createdFrom: 'HISTORY',
            creatorId,
            creatorName,
        },
    });
    return template;
}
export async function applyScheduleTemplate(templateId, employeeIds, startDate) {
    const template = await prisma.scheduleTemplate.findUnique({
        where: { id: templateId },
    });
    if (!template)
        throw Errors.notFound('排班模板不存在');
    const pattern = template.pattern;
    // 生成全部候选排班记录
    const candidates = [];
    const allDates = [];
    for (const employeeId of employeeIds) {
        for (const item of pattern) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + item.dayOffset);
            date.setHours(0, 0, 0, 0);
            candidates.push({ employeeId, shiftTemplateId: item.shiftTemplateId, date });
            allDates.push(date);
        }
    }
    // 批量查询已有排班，构建冲突 Set
    const existingSchedules = await prisma.schedule.findMany({
        where: {
            employeeId: { in: employeeIds },
            date: { in: allDates },
        },
        select: { employeeId: true, date: true },
    });
    const existingSet = new Set(existingSchedules.map((s) => `${s.employeeId}_${s.date.toISOString().split('T')[0]}`));
    // 过滤冲突
    let skipped = 0;
    const conflicts = [];
    const toCreate = candidates.filter((c) => {
        const key = `${c.employeeId}_${c.date.toISOString().split('T')[0]}`;
        if (existingSet.has(key)) {
            skipped++;
            conflicts.push({ employeeId: c.employeeId, date: key.split('_')[1], reason: '当日已有排班' });
            return false;
        }
        return true;
    });
    // 批量创建
    let created = 0;
    if (toCreate.length > 0) {
        const result = await prisma.schedule.createMany({
            data: toCreate.map((c) => ({
                employeeId: c.employeeId,
                shiftTemplateId: c.shiftTemplateId,
                date: c.date,
                status: 'DRAFT',
            })),
            skipDuplicates: true,
        });
        created = result.count;
    }
    return { created, skipped, conflicts };
}
export async function listScheduleTemplates(page, pageSize, departmentId) {
    const where = {};
    if (departmentId)
        where.departmentId = departmentId;
    const [total, items] = await Promise.all([
        prisma.scheduleTemplate.count({ where }),
        prisma.scheduleTemplate.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    return { total, items };
}
export async function getScheduleTemplate(id) {
    const template = await prisma.scheduleTemplate.findUnique({ where: { id } });
    if (!template)
        throw Errors.notFound('排班模板不存在');
    return template;
}
export async function deleteScheduleTemplate(id) {
    await getScheduleTemplate(id);
    return prisma.scheduleTemplate.delete({ where: { id } });
}
//# sourceMappingURL=schedule-template.service.js.map