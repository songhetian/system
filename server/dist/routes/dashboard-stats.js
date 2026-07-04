import { prisma } from '../lib/prisma.js';
export const dashboardStatsRoutes = async (app) => {
    app.get('/', async () => {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        // 部门人数分布
        const departments = await prisma.department.findMany({
            where: { deletedAt: null },
            include: {
                positions: {
                    include: {
                        employeePositions: { include: { employee: true } },
                    },
                },
            },
        });
        const deptChart = departments.map((d) => ({
            name: d.name,
            count: d.positions.reduce((sum, p) => sum + p.employeePositions.filter((ep) => ep.employee.status === 'ACTIVE').length, 0),
        }));
        // 本月每日考勤统计
        const daysInMonth = new Date(year, month, 0).getDate();
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: {
                    gte: new Date(year, month - 1, 1),
                    lte: new Date(year, month - 1, daysInMonth),
                },
                deletedAt: null,
            },
        });
        const attendanceTrend = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayRecords = attendanceRecords.filter((r) => r.date.getDate() === d);
            attendanceTrend.push({
                date: dateStr,
                onTime: dayRecords.filter((r) => r.status === 'ON_TIME').length,
                late: dayRecords.filter((r) => r.status === 'LATE').length,
                absent: dayRecords.filter((r) => r.status === 'ABSENT').length,
            });
        }
        // 本月请假/加班统计
        const [leaveCount, overtimeCount] = await Promise.all([
            prisma.leaveRequest.count({
                where: {
                    status: 'APPROVED',
                    createdAt: {
                        gte: new Date(year, month - 1, 1),
                        lte: new Date(year, month - 1, daysInMonth),
                    },
                },
            }),
            prisma.overtimeRequest.count({
                where: {
                    status: 'APPROVED',
                    createdAt: {
                        gte: new Date(year, month - 1, 1),
                        lte: new Date(year, month - 1, daysInMonth),
                    },
                },
            }),
        ]);
        const summaryChart = {
            labels: ['请假', '加班', '报销', '培训'],
            values: [leaveCount, overtimeCount, 0, 0],
        };
        return {
            code: 0,
            data: {
                departmentChart: deptChart,
                attendanceTrend,
                summaryChart,
            },
            message: 'success',
        };
    });
};
//# sourceMappingURL=dashboard-stats.js.map