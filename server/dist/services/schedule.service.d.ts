import type { ScheduleCreate, ScheduleUpdate, ScheduleGenerateInput, ScheduleGenerateResult, ScheduleClearRange } from '@shop/shared';
export declare function createSchedule(data: ScheduleCreate): Promise<{
    date: Date;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    departmentId: number | null;
    status: import("@prisma/client").$Enums.ScheduleStatus;
    positionId: number | null;
    shiftTemplateId: number;
    conflicts: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function findSchedulesByDateRange(params: {
    startDate: string;
    endDate: string;
    departmentId?: number;
    employeeId?: number;
}): Promise<({
    employee: {
        id: number;
        name: string;
        employeeNo: string;
    };
    shiftTemplate: {
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        startTime: string;
        endTime: string;
        color: string;
    };
} & {
    date: Date;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    departmentId: number | null;
    status: import("@prisma/client").$Enums.ScheduleStatus;
    positionId: number | null;
    shiftTemplateId: number;
    conflicts: import("@prisma/client/runtime/library").JsonValue;
})[]>;
export declare function updateSchedule(id: number, data: ScheduleUpdate): Promise<{
    date: Date;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    departmentId: number | null;
    status: import("@prisma/client").$Enums.ScheduleStatus;
    positionId: number | null;
    shiftTemplateId: number;
    conflicts: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function deleteSchedule(id: number): Promise<boolean>;
export declare function generateSchedule(data: ScheduleGenerateInput): Promise<ScheduleGenerateResult>;
export declare function clearScheduleRange(data: ScheduleClearRange): Promise<number>;
export declare function checkConflicts(params: {
    startDate: string;
    endDate: string;
}): Promise<{
    employeeId: number;
    employeeName: string;
    date: string;
    conflicts: string[];
}[]>;
//# sourceMappingURL=schedule.service.d.ts.map