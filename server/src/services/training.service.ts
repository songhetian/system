import { prisma } from '../lib/prisma.js';
import type { TrainingCourseCreate, TrainingCourseUpdate, TrainingCourseQuery, TrainingEnrollment, TrainingCompletion } from '@shop/shared';

export async function createTrainingCourse(data: TrainingCourseCreate) {
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

export async function getTrainingCourseById(id: number) {
  return prisma.trainingCourse.findUnique({ where: { id }, include: { enrollments: true } });
}

export async function listTrainingCourses(query: TrainingCourseQuery) {
  const { page = 1, pageSize = 10, status, keyword } = query;
  const where: any = {};
  if (status) where.status = status;
  if (keyword) where.name = { contains: keyword };

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

export async function updateTrainingCourse(id: number, data: TrainingCourseUpdate) {
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

export async function deleteTrainingCourse(id: number) {
  await prisma.trainingCourse.delete({ where: { id } });
}

export async function enrollInCourse(courseId: number, data: TrainingEnrollment) {
  const results = await prisma.$transaction(
    data.employeeIds.map((employeeId) =>
      prisma.trainingEnrollment.create({
        data: { courseId, employeeId },
      }),
    ),
  );
  return { count: results.length };
}

export async function completeTraining(data: TrainingCompletion) {
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

export async function getTrainingRecords(employeeId?: number) {
  const where: any = {};
  if (employeeId) where.employeeId = employeeId;

  return prisma.trainingEnrollment.findMany({
    where,
    include: {
      course: true,
      employee: { select: { name: true } },
    },
    orderBy: [{ completedAt: 'desc' }, { enrolledAt: 'desc' }],
  });
}