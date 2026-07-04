export interface GenerateInput {
    year: number;
    month: number;
    departmentId: number | null;
    employeeId?: number;
}
export interface FindByFilterParams {
    year?: number;
    month?: number;
    departmentId?: number;
    employeeId?: number;
    page?: number;
    pageSize?: number;
}
export declare function generate(data: GenerateInput): Promise<number>;
export declare function findByFilter(params: FindByFilterParams): Promise<{
    list: {
        employeeName: string;
        employee: {
            name: string;
            employeeNo: string;
        };
        createdAt: Date;
        id: number;
        employeeId: number;
        updatedAt: Date;
        year: number;
        month: number;
        shouldWorkDays: import("@prisma/client/runtime/library").Decimal;
        actualWorkDays: import("@prisma/client/runtime/library").Decimal;
        lateCount: number;
        earlyCount: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        absentDays: import("@prisma/client/runtime/library").Decimal;
        locked: boolean;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function findById(id: number): Promise<{
    employeeName: string;
    employee: {
        name: string;
        employeeNo: string;
    };
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    year: number;
    month: number;
    shouldWorkDays: import("@prisma/client/runtime/library").Decimal;
    actualWorkDays: import("@prisma/client/runtime/library").Decimal;
    lateCount: number;
    earlyCount: number;
    overtimeHours: import("@prisma/client/runtime/library").Decimal;
    absentDays: import("@prisma/client/runtime/library").Decimal;
    locked: boolean;
} | null>;
export declare function lock(id: number): Promise<{
    employeeName: string;
    employee: {
        name: string;
        employeeNo: string;
    };
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    year: number;
    month: number;
    shouldWorkDays: import("@prisma/client/runtime/library").Decimal;
    actualWorkDays: import("@prisma/client/runtime/library").Decimal;
    lateCount: number;
    earlyCount: number;
    overtimeHours: import("@prisma/client/runtime/library").Decimal;
    absentDays: import("@prisma/client/runtime/library").Decimal;
    locked: boolean;
}>;
export declare function unlock(id: number): Promise<{
    employeeName: string;
    employee: {
        name: string;
        employeeNo: string;
    };
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    year: number;
    month: number;
    shouldWorkDays: import("@prisma/client/runtime/library").Decimal;
    actualWorkDays: import("@prisma/client/runtime/library").Decimal;
    lateCount: number;
    earlyCount: number;
    overtimeHours: import("@prisma/client/runtime/library").Decimal;
    absentDays: import("@prisma/client/runtime/library").Decimal;
    locked: boolean;
}>;
//# sourceMappingURL=attendance-summary.service.d.ts.map