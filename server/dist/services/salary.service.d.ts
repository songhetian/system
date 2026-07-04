import type { SalaryStructureCreate, SalaryStructureUpdate, PayslipGenerate, PayslipQuery, SalaryAuditLogQuery } from '@shop/shared';
export declare function createSalaryStructure(data: SalaryStructureCreate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    items: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function getSalaryStructureById(id: number): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    items: import("@prisma/client/runtime/library").JsonValue;
} | null>;
export declare function listSalaryStructures(page: number, pageSize: number): Promise<{
    list: {
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        items: import("@prisma/client/runtime/library").JsonValue;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updateSalaryStructure(id: number, data: SalaryStructureUpdate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    items: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function deleteSalaryStructure(id: number): Promise<void>;
export declare function assignSalaryStructure(structureId: number, employeeIds: number[]): Promise<{
    count: number;
}>;
export declare function generatePayslips(data: PayslipGenerate): Promise<{
    count: number;
}>;
export declare function listPayslips(query: PayslipQuery): Promise<{
    list: {
        createdAt: Date;
        id: number;
        employeeId: number;
        updatedAt: Date;
        departmentId: number | null;
        employeeName: string;
        year: number;
        month: number;
        items: import("@prisma/client/runtime/library").JsonValue;
        departmentName: string;
        grossPay: import("@prisma/client/runtime/library").Decimal;
        deductions: import("@prisma/client/runtime/library").Decimal;
        netPay: import("@prisma/client/runtime/library").Decimal;
        positionName: string;
        generatedAt: Date;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getPayslipById(id: number): Promise<{
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    departmentId: number | null;
    employeeName: string;
    year: number;
    month: number;
    items: import("@prisma/client/runtime/library").JsonValue;
    departmentName: string;
    grossPay: import("@prisma/client/runtime/library").Decimal;
    deductions: import("@prisma/client/runtime/library").Decimal;
    netPay: import("@prisma/client/runtime/library").Decimal;
    positionName: string;
    generatedAt: Date;
} | null>;
export declare function listSalaryAuditLogs(query: SalaryAuditLogQuery): Promise<{
    list: {
        username: string;
        user: undefined;
        userId: number;
        action: import("@prisma/client").$Enums.SalaryAuditAction;
        ip: string;
        createdAt: Date;
        id: number;
        userAgent: string | null;
        detail: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
//# sourceMappingURL=salary.service.d.ts.map