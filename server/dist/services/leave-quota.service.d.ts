import { type LeaveQuotaQuery } from '@shop/shared';
export declare class LeaveQuotaError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export declare function initLeaveQuota(year: number, employeeIds?: number[]): Promise<{
    count: number;
}>;
export declare function findLeaveQuotaByFilter(params: LeaveQuotaQuery): Promise<{
    list: {
        employeeName: string;
        employee: {
            name: string;
        };
        createdAt: Date;
        id: number;
        employeeId: number;
        updatedAt: Date;
        year: number;
        annualBalance: import("@prisma/client/runtime/library").Decimal;
        annualUsed: import("@prisma/client/runtime/library").Decimal;
        sickUsed: import("@prisma/client/runtime/library").Decimal;
        personalUsed: import("@prisma/client/runtime/library").Decimal;
        compensatoryBalance: import("@prisma/client/runtime/library").Decimal;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function findLeaveQuotaById(id: number): Promise<{
    employeeName: string;
    employee: {
        name: string;
    };
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    year: number;
    annualBalance: import("@prisma/client/runtime/library").Decimal;
    annualUsed: import("@prisma/client/runtime/library").Decimal;
    sickUsed: import("@prisma/client/runtime/library").Decimal;
    personalUsed: import("@prisma/client/runtime/library").Decimal;
    compensatoryBalance: import("@prisma/client/runtime/library").Decimal;
}>;
export declare function updateLeaveQuota(id: number, data: Partial<{
    annualBalance: number;
    annualUsed: number;
    sickUsed: number;
    personalUsed: number;
    compensatoryBalance: number;
}>): Promise<{
    employeeName: string;
    employee: {
        name: string;
    };
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    year: number;
    annualBalance: import("@prisma/client/runtime/library").Decimal;
    annualUsed: import("@prisma/client/runtime/library").Decimal;
    sickUsed: import("@prisma/client/runtime/library").Decimal;
    personalUsed: import("@prisma/client/runtime/library").Decimal;
    compensatoryBalance: import("@prisma/client/runtime/library").Decimal;
}>;
export declare function deductLeaveQuota(data: {
    employeeId: number;
    year: number;
    type: 'ANNUAL' | 'SICK' | 'PERSONAL' | 'COMPENSATORY';
    days: number;
}, tx?: any): Promise<any>;
//# sourceMappingURL=leave-quota.service.d.ts.map