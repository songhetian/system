import type { ClockType } from '@shop/shared';
export declare class AttendanceRecordError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export interface ClockInput {
    employeeId: number;
    type: ClockType;
    timestamp: Date;
}
export interface FindByFilterParams {
    employeeId?: number;
    dateFrom?: string;
    dateTo?: string;
    departmentId?: number;
    page?: number;
    pageSize?: number;
}
export declare function clock(data: ClockInput): Promise<{
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.ClockType;
    employeeId: number;
    updatedAt: Date;
    timestamp: Date;
    lateMinutes: number;
    earlyMinutes: number;
}>;
export declare function findByFilter(params: FindByFilterParams): Promise<{
    list: ({
        employee: {
            name: string;
            employeeNo: string;
        };
    } & {
        createdAt: Date;
        id: number;
        type: import("@prisma/client").$Enums.ClockType;
        employeeId: number;
        updatedAt: Date;
        timestamp: Date;
        lateMinutes: number;
        earlyMinutes: number;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function findById(id: number): Promise<({
    employee: {
        name: string;
        employeeNo: string;
    };
} & {
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.ClockType;
    employeeId: number;
    updatedAt: Date;
    timestamp: Date;
    lateMinutes: number;
    earlyMinutes: number;
}) | null>;
//# sourceMappingURL=attendance-record.service.d.ts.map