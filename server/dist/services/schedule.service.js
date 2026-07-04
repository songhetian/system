import { prisma } from '../lib/prisma.js';
import { BusinessError } from '../lib/errors.js';
export async function createSchedule(data) {
    try {
        return await prisma.schedule.create({
            data: {
                ...data,
                date: new Date(data.date),
            },
        });
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('employeeId') && error.meta?.target?.includes('date')) {
            throw new BusinessError('该员工当天已有排班记录', 30201, 400);
        }
        throw new BusinessError('创建排班记录失败', 30202, 500);
    }
}
export async function findSchedulesByDateRange(params) {
    const where = {
        date: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
        },
    };
    if (params.employeeId) {
        where.employeeId = params.employeeId;
    }
    if (params.departmentId) {
        where.employee = {
            employeePositions: {
                some: {
                    position: {
                        departmentId: params.departmentId,
                    },
                },
            },
        };
    }
    return await prisma.schedule.findMany({
        where,
        include: {
            shiftTemplate: true,
            employee: {
                select: { id: true, name: true, employeeNo: true },
            },
        },
        orderBy: { date: 'asc' },
    });
}
export async function updateSchedule(id, data) {
    try {
        return await prisma.schedule.update({
            where: { id },
            data,
        });
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('employeeId') && error.meta?.target?.includes('date')) {
            throw new BusinessError('该员工当天已有排班记录', 30201, 400);
        }
        if (error.code === 'P2025') {
            throw new BusinessError('排班记录不存在', 30203, 404);
        }
        throw new BusinessError('更新排班记录失败', 30204, 500);
    }
}
export async function deleteSchedule(id) {
    try {
        await prisma.schedule.delete({ where: { id } });
        return true;
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new BusinessError('排班记录不存在', 30203, 404);
        }
        throw new BusinessError('删除排班记录失败', 30205, 500);
    }
}
export async function generateSchedule(data) {
    const rotationRule = await prisma.rotationRule.findUnique({
        where: { id: data.rotationRuleId },
    });
    if (!rotationRule) {
        throw new BusinessError('轮班规则不存在', 30206, 404);
    }
    const employees = await prisma.employee.findMany({
        where: {
            employeePositions: {
                some: {
                    position: {
                        departmentId: data.departmentId,
                    },
                    endDate: null,
                },
            },
        },
        select: { id: true },
    });
    const employeeIds = employees.map((e) => e.id);
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const pattern = rotationRule.pattern;
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const [existingSchedules, leaveRequests] = await Promise.all([
        prisma.schedule.findMany({
            where: {
                employeeId: { in: employeeIds },
                date: { gte: startDate, lte: endDate },
            },
            select: { employeeId: true, date: true },
        }),
        prisma.leaveRequest.findMany({
            where: {
                employeeId: { in: employeeIds },
                status: 'APPROVED',
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
            select: { employeeId: true, startDate: true, endDate: true },
        }),
    ]);
    const scheduleSet = new Set(existingSchedules.map((s) => {
        const d = new Date(s.date);
        return `${s.employeeId}-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }));
    const leaveMap = new Map();
    for (const leave of leaveRequests) {
        if (!leaveMap.has(leave.employeeId)) {
            leaveMap.set(leave.employeeId, []);
        }
        leaveMap.get(leave.employeeId).push({ start: leave.startDate, end: leave.endDate });
    }
    function hasLeave(empId, date) {
        const leaves = leaveMap.get(empId);
        if (!leaves)
            return false;
        return leaves.some((l) => l.start <= date && l.end >= date);
    }
    const toCreate = [];
    let totalAssigned = 0;
    let conflicting = 0;
    let skippedLeave = 0;
    for (const employee of employees) {
        for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + dayIndex);
            currentDate.setHours(0, 0, 0, 0);
            const patternIndex = dayIndex % rotationRule.cycleDays;
            const shiftTemplateId = pattern[patternIndex]?.shiftTemplateId;
            if (!shiftTemplateId)
                continue;
            const dateKey = `${employee.id}-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            if (scheduleSet.has(dateKey)) {
                conflicting++;
                continue;
            }
            if (hasLeave(employee.id, currentDate)) {
                skippedLeave++;
                continue;
            }
            toCreate.push({ employeeId: employee.id, shiftTemplateId, date: currentDate });
            totalAssigned++;
        }
    }
    if (toCreate.length > 0) {
        await prisma.schedule.createMany({
            data: toCreate,
            skipDuplicates: true,
        });
    }
    return { totalAssigned, conflicting, skippedLeave };
}
export async function clearScheduleRange(data) {
    const where = {
        date: {
            gte: new Date(data.startDate),
            lte: new Date(data.endDate),
        },
    };
    if (data.departmentId) {
        where.employee = {
            employeePositions: {
                some: {
                    position: {
                        departmentId: data.departmentId,
                    },
                },
            },
        };
    }
    const result = await prisma.schedule.deleteMany({ where });
    return result.count;
}
export async function checkConflicts(params) {
    const schedules = await prisma.schedule.findMany({
        where: {
            date: {
                gte: new Date(params.startDate),
                lte: new Date(params.endDate),
            },
        },
        include: {
            employee: { select: { id: true, name: true } },
            shiftTemplate: { select: { name: true, startTime: true, endTime: true } },
        },
    });
    const conflicts = [];
    const scheduleMap = new Map();
    for (const schedule of schedules) {
        const key = `${schedule.employeeId}-${schedule.date.toISOString().split('T')[0]}`;
        if (!scheduleMap.has(key)) {
            scheduleMap.set(key, []);
        }
        scheduleMap.get(key).push(schedule);
    }
    for (const [key, items] of scheduleMap) {
        if (items.length > 1) {
            const [employeeIdStr, dateStr] = key.split('-');
            conflicts.push({
                employeeId: parseInt(employeeIdStr),
                employeeName: items[0].employee.name,
                date: dateStr,
                conflicts: items.map((s) => s.shiftTemplate.name),
            });
        }
    }
    return conflicts;
}
//# sourceMappingURL=schedule.service.js.map