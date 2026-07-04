import type { ExpenseClaimCreate, ExpenseClaimUpdate, ExpenseClaimQuery } from '@shop/shared';
export declare function createExpenseClaim(data: ExpenseClaimCreate, employeeId: number): Promise<{
    title: string;
    description: string | null;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ExpenseClaimStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    amount: import("@prisma/client/runtime/library").Decimal;
    expenseType: import("@prisma/client").$Enums.ExpenseType;
    workflowInstanceId: number | null;
}>;
export declare function getExpenseClaimById(id: number): Promise<{
    title: string;
    description: string | null;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ExpenseClaimStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    amount: import("@prisma/client/runtime/library").Decimal;
    expenseType: import("@prisma/client").$Enums.ExpenseType;
    workflowInstanceId: number | null;
} | null>;
export declare function listExpenseClaims(query: ExpenseClaimQuery): Promise<{
    list: {
        title: string;
        description: string | null;
        createdAt: Date;
        id: number;
        employeeId: number;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ExpenseClaimStatus;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseType: import("@prisma/client").$Enums.ExpenseType;
        workflowInstanceId: number | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updateExpenseClaim(id: number, data: ExpenseClaimUpdate): Promise<{
    title: string;
    description: string | null;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ExpenseClaimStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    amount: import("@prisma/client/runtime/library").Decimal;
    expenseType: import("@prisma/client").$Enums.ExpenseType;
    workflowInstanceId: number | null;
}>;
export declare function submitExpenseClaim(id: number): Promise<{
    title: string;
    description: string | null;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ExpenseClaimStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    amount: import("@prisma/client/runtime/library").Decimal;
    expenseType: import("@prisma/client").$Enums.ExpenseType;
    workflowInstanceId: number | null;
}>;
export declare function approveExpenseClaim(id: number): Promise<{
    title: string;
    description: string | null;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ExpenseClaimStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    amount: import("@prisma/client/runtime/library").Decimal;
    expenseType: import("@prisma/client").$Enums.ExpenseType;
    workflowInstanceId: number | null;
}>;
export declare function rejectExpenseClaim(id: number): Promise<{
    title: string;
    description: string | null;
    createdAt: Date;
    id: number;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.ExpenseClaimStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    amount: import("@prisma/client/runtime/library").Decimal;
    expenseType: import("@prisma/client").$Enums.ExpenseType;
    workflowInstanceId: number | null;
}>;
//# sourceMappingURL=expense.service.d.ts.map