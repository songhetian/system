import type { TrainingCourseCreate, TrainingCourseUpdate, TrainingCourseQuery, TrainingEnrollment, TrainingCompletion } from '@shop/shared';
export declare function createTrainingCourse(data: TrainingCourseCreate): Promise<{
    location: string | null;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    type: import("@prisma/client").$Enums.TrainingType;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.TrainingCourseStatus;
    startDate: Date;
    endDate: Date;
    trainer: string | null;
    maxAttendees: number | null;
}>;
export declare function getTrainingCourseById(id: number): Promise<({
    enrollments: {
        id: number;
        employeeId: number;
        score: import("@prisma/client/runtime/library").Decimal | null;
        completedAt: Date | null;
        courseId: number;
        enrolledAt: Date;
    }[];
} & {
    location: string | null;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    type: import("@prisma/client").$Enums.TrainingType;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.TrainingCourseStatus;
    startDate: Date;
    endDate: Date;
    trainer: string | null;
    maxAttendees: number | null;
}) | null>;
export declare function listTrainingCourses(query: TrainingCourseQuery): Promise<{
    list: {
        location: string | null;
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        type: import("@prisma/client").$Enums.TrainingType;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TrainingCourseStatus;
        startDate: Date;
        endDate: Date;
        trainer: string | null;
        maxAttendees: number | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updateTrainingCourse(id: number, data: TrainingCourseUpdate): Promise<{
    location: string | null;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    type: import("@prisma/client").$Enums.TrainingType;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.TrainingCourseStatus;
    startDate: Date;
    endDate: Date;
    trainer: string | null;
    maxAttendees: number | null;
}>;
export declare function deleteTrainingCourse(id: number): Promise<void>;
export declare function enrollInCourse(courseId: number, data: TrainingEnrollment): Promise<{
    count: number;
}>;
export declare function completeTraining(data: TrainingCompletion): Promise<{
    employee: {
        name: string;
    };
    course: {
        location: string | null;
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        type: import("@prisma/client").$Enums.TrainingType;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TrainingCourseStatus;
        startDate: Date;
        endDate: Date;
        trainer: string | null;
        maxAttendees: number | null;
    };
} & {
    id: number;
    employeeId: number;
    score: import("@prisma/client/runtime/library").Decimal | null;
    completedAt: Date | null;
    courseId: number;
    enrolledAt: Date;
}>;
export declare function getTrainingRecords(employeeId?: number): Promise<({
    employee: {
        name: string;
    };
    course: {
        location: string | null;
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        type: import("@prisma/client").$Enums.TrainingType;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.TrainingCourseStatus;
        startDate: Date;
        endDate: Date;
        trainer: string | null;
        maxAttendees: number | null;
    };
} & {
    id: number;
    employeeId: number;
    score: import("@prisma/client/runtime/library").Decimal | null;
    completedAt: Date | null;
    courseId: number;
    enrolledAt: Date;
})[]>;
//# sourceMappingURL=training.service.d.ts.map