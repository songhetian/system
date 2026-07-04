import { prisma } from '../lib/prisma.js';
export class AttendanceRecordError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}
export async function clock(data) {
    const { employeeId, type, timestamp } = data;
    const schedule = await prisma.schedule.findFirst({
        where: {
            employeeId,
            date: {
                gte: new Date(timestamp.toDateString()),
                lt: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000),
            },
        },
        include: {
            shiftTemplate: true,
        },
    });
    let lateMinutes = 0;
    let earlyMinutes = 0;
    if (schedule?.shiftTemplate) {
        const [startHour, startMinute] = schedule.shiftTemplate.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.shiftTemplate.endTime.split(':').map(Number);
        const scheduledStart = new Date(timestamp);
        scheduledStart.setHours(startHour, startMinute, 0, 0);
        const scheduledEnd = new Date(timestamp);
        scheduledEnd.setHours(endHour, endMinute, 0, 0);
        if (type === 'IN') {
            if (timestamp > scheduledStart) {
                lateMinutes = Math.floor((timestamp.getTime() - scheduledStart.getTime()) / (1000 * 60));
            }
        }
        else if (type === 'OUT') {
            if (timestamp < scheduledEnd) {
                earlyMinutes = Math.floor((scheduledEnd.getTime() - timestamp.getTime()) / (1000 * 60));
            }
        }
    }
    return await prisma.attendanceRecord.create({
        data: {
            employeeId,
            type,
            timestamp,
            lateMinutes,
            earlyMinutes,
        },
    });
}
export async function findByFilter(params) {
    const { employeeId, dateFrom, dateTo, departmentId, page = 1, pageSize = 10 } = params;
    const where = {};
    if (employeeId) {
        where.employeeId = employeeId;
    }
    if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) {
            where.timestamp.gte = new Date(dateFrom);
        }
        if (dateTo) {
            where.timestamp.lte = new Date(dateTo + 'T23:59:59');
        }
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
        prisma.attendanceRecord.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                employee: {
                    select: {
                        name: true,
                        employeeNo: true,
                    },
                },
            },
        }),
        prisma.attendanceRecord.count({ where }),
    ]);
    return {
        list,
        total,
        page,
        pageSize,
    };
}
export async function findById(id) {
    return await prisma.attendanceRecord.findUnique({
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
}
//# sourceMappingURL=attendance-record.service.js.map