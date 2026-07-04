export interface ScheduleTemplatePatternItem {
    dayOffset: number;
    shiftTemplateId: number;
}
export interface CreateScheduleTemplateInput {
    name: string;
    departmentId?: number;
    description?: string;
    sourceStartDate: Date;
    sourceEndDate: Date;
    sourceEmployees: number[];
    creatorId: number;
    creatorName: string;
}
export declare function createScheduleTemplateFromHistory(input: CreateScheduleTemplateInput): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    departmentId: number | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    creatorId: number;
    sourceStartDate: Date;
    sourceEndDate: Date;
    creatorName: string;
    totalDays: number;
    createdFrom: string;
}>;
export declare function applyScheduleTemplate(templateId: number, employeeIds: number[], startDate: Date): Promise<{
    created: number;
    skipped: number;
    conflicts: Array<{
        employeeId: number;
        date: string;
        reason: string;
    }>;
}>;
export declare function listScheduleTemplates(page: number, pageSize: number, departmentId?: number): Promise<{
    total: number;
    items: {
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: number | null;
        pattern: import("@prisma/client/runtime/library").JsonValue;
        creatorId: number;
        sourceStartDate: Date;
        sourceEndDate: Date;
        creatorName: string;
        totalDays: number;
        createdFrom: string;
    }[];
}>;
export declare function getScheduleTemplate(id: number): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    departmentId: number | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    creatorId: number;
    sourceStartDate: Date;
    sourceEndDate: Date;
    creatorName: string;
    totalDays: number;
    createdFrom: string;
}>;
export declare function deleteScheduleTemplate(id: number): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    departmentId: number | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    creatorId: number;
    sourceStartDate: Date;
    sourceEndDate: Date;
    creatorName: string;
    totalDays: number;
    createdFrom: string;
}>;
//# sourceMappingURL=schedule-template.service.d.ts.map