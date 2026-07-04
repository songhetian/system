import { prisma } from '../lib/prisma.js';
export async function createTrainingCourse(data) {
    return prisma.trainingCourse.create({
        data: {
            name: data.name,
            description: data.description,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            type: data.type,
            location: data.location,
            trainer: data.trainer,
            maxAttendees: data.maxAttendees,
        },
    });
}
export async function getTrainingCourseById(id) {
    return prisma.trainingCourse.findUnique({ where: { id }, include: { enrollments: true } });
}
export async function listTrainingCourses(query) {
    const { page = 1, pageSize = 10, status, keyword } = query;
    const where = {};
    if (status)
        where.status = status;
    if (keyword)
        where.name = { contains: keyword };
    const [list, total] = await Promise.all([
        prisma.trainingCourse.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ startDate: 'desc' }],
        }),
        prisma.trainingCourse.count({ where }),
    ]);
    return { list, total, page, pageSize };
}
export async function updateTrainingCourse(id, data) {
    return prisma.trainingCourse.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
            ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
            ...(data.type !== undefined && { type: data.type }),
            ...(data.location !== undefined && { location: data.location }),
            ...(data.trainer !== undefined && { trainer: data.trainer }),
            ...(data.maxAttendees !== undefined && { maxAttendees: data.maxAttendees }),
        },
    });
}
export async function deleteTrainingCourse(id) {
    await prisma.trainingCourse.delete({ where: { id } });
}
export async function enrollInCourse(courseId, data) {
    const results = await prisma.$transaction(data.employeeIds.map((employeeId) => prisma.trainingEnrollment.create({
        data: { courseId, employeeId },
    })));
    return { count: results.length };
}
export async function completeTraining(data) {
    return prisma.trainingEnrollment.update({
        where: { courseId_employeeId: { courseId: data.courseId, employeeId: data.employeeId } },
        data: {
            score: data.score,
            completedAt: new Date(),
        },
        include: {
            course: true,
            employee: { select: { name: true } },
        },
    });
}
export async function getTrainingRecords(employeeId) {
    const where = {};
    if (employeeId)
        where.employeeId = employeeId;
    return prisma.trainingEnrollment.findMany({
        where,
        include: {
            course: true,
            employee: { select: { name: true } },
        },
        orderBy: [{ completedAt: 'desc' }, { enrolledAt: 'desc' }],
    });
}
//# sourceMappingURL=training.service.js.map