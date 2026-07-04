import { prisma } from '../lib/prisma.js';
import { BusinessError } from '../lib/errors.js';
export async function generate(data) {
    const { year, month, departmentId, employeeId } = data;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const endDateNext = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    const where = {
        deletedAt: null,
    };
    if (employeeId) {
        where.id = employeeId;
    }
    else if (departmentId) {
        where.employeePositions = {
            some: {
                position: {
                    departmentId,
                },
            },
        };
    }
    const employees = await prisma.employee.findMany({
        where,
        select: { id: true },
    });
    const employeeIds = employees.map((e) => e.id);
    if (employeeIds.length === 0)
        return 0;
    const [lockedSummaries, schedules, records] = await Promise.all([
        prisma.attendanceSummary.findMany({
            where: {
                employeeId: { in: employeeIds },
                year,
                month,
                locked: true,
            },
            select: { employeeId: true },
        }),
        prisma.schedule.findMany({
            where: {
                employeeId: { in: employeeIds },
                date: { gte: startDate, lte: endDate },
            },
            select: { employeeId: true, date: true },
        }),
        prisma.attendanceRecord.findMany({
            where: {
                employeeId: { in: employeeIds },
                timestamp: { gte: startDate, lt: endDateNext },
            },
            select: { employeeId: true, timestamp: true, type: true, lateMinutes: true, earlyMinutes: true },
        }),
    ]);
    const lockedSet = new Set(lockedSummaries.map((s) => s.employeeId));
    if (lockedSet.size > 0) {
        throw new BusinessError('考勤台账已锁定，无法修改', 22000, 400);
    }
    const scheduleCountMap = new Map();
    for (const s of schedules) {
        scheduleCountMap.set(s.employeeId, (scheduleCountMap.get(s.employeeId) || 0) + 1);
    }
    const recordMap = new Map();
    for (const r of records) {
        const day = r.timestamp.getDate();
        if (!recordMap.has(r.employeeId)) {
            recordMap.set(r.employeeId, []);
        }
        recordMap.get(r.employeeId).push({
            date: day,
            type: r.type,
            lateMinutes: r.lateMinutes,
            earlyMinutes: r.earlyMinutes,
        });
    }
    const results = [];
    for (const employee of employees) {
        const shouldWorkDays = scheduleCountMap.get(employee.id) || 0;
        const empRecords = recordMap.get(employee.id) || [];
        const workDays = new Set();
        let lateCount = 0;
        let earlyCount = 0;
        for (const record of empRecords) {
            workDays.add(record.date);
            if (record.type === 'IN' && record.lateMinutes > 0)
                lateCount++;
            if (record.type === 'OUT' && record.earlyMinutes > 0)
                earlyCount++;
        }
        const actualWorkDays = workDays.size;
        const absentDays = Math.max(0, shouldWorkDays - actualWorkDays);
        results.push({
            employeeId: employee.id,
            shouldWorkDays,
            actualWorkDays,
            lateCount,
            earlyCount,
            absentDays,
        });
    }
    let count = 0;
    try {
        await prisma.$transaction(results.map((r) => prisma.attendanceSummary.upsert({
            where: {
                employeeId_year_month: {
                    employeeId: r.employeeId,
                    year,
                    month,
                },
            },
            update: {
                shouldWorkDays: r.shouldWorkDays,
                actualWorkDays: r.actualWorkDays,
                lateCount: r.lateCount,
                earlyCount: r.earlyCount,
                absentDays: r.absentDays,
            },
            create: {
                employeeId: r.employeeId,
                year,
                month,
                shouldWorkDays: r.shouldWorkDays,
                actualWorkDays: r.actualWorkDays,
                lateCount: r.lateCount,
                earlyCount: r.earlyCount,
                absentDays: r.absentDays,
            },
        })));
        count = results.length;
    }
    catch (err) {
        // ponytail: 并发场景下员工可能已被删除，跳过 P2003 错误
        if (err?.code === 'P2003') {
            count = 0;
        }
        else {
            throw err;
        }
    }
    return count;
}
export async function findByFilter(params) {
    const { year, month, departmentId, employeeId, page = 1, pageSize = 10 } = params;
    const where = {};
    if (year) {
        where.year = year;
    }
    if (month) {
        where.month = month;
    }
    if (employeeId) {
        where.employeeId = employeeId;
    }
    if (departmentId) {
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
    const [list, total] = await Promise.all([
        prisma.attendanceSummary.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
            ],
            include: {
                employee: {
                    select: {
                        name: true,
                        employeeNo: true,
                    },
                },
            },
        }),
        prisma.attendanceSummary.count({ where }),
    ]);
    const formattedList = list.map((summary) => ({
        ...summary,
        employeeName: summary.employee?.name || '',
    }));
    return {
        list: formattedList,
        total,
        page,
        pageSize,
    };
}
export async function findById(id) {
    const summary = await prisma.attendanceSummary.findUnique({
        where: { id },
        include: {
            employee: {
                select: {
                    name: true,
                    employeeNo: true,
                },
            },
        },
    });
    if (!summary) {
        return null;
    }
    return {
        ...summary,
        employeeName: summary.employee?.name || '',
    };
}
export async function lock(id) {
    const summary = await prisma.attendanceSummary.update({
        where: { id },
        data: { locked: true },
        include: {
            employee: {
                select: {
                    name: true,
                    employeeNo: true,
                },
            },
        },
    });
    return {
        ...summary,
        employeeName: summary.employee?.name || '',
    };
}
export async function unlock(id) {
    const summary = await prisma.attendanceSummary.update({
        where: { id },
        data: { locked: false },
        include: {
            employee: {
                select: {
                    name: true,
                    employeeNo: true,
                },
            },
        },
    });
    return {
        ...summary,
        employeeName: summary.employee?.name || '',
    };
}
//# sourceMappingURL=attendance-summary.service.js.map