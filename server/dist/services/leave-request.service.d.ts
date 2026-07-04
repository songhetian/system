import { type LeaveRequestCreate, type LeaveRequestUpdate, type LeaveRequestQuery, type LeaveApproval, type LeaveRejection } from '@shop/shared';
export declare class LeaveRequestError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export declare function createLeaveRequest(data: LeaveRequestCreate): Promise<{
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.LeaveType;
    reason: string;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.LeaveRequestStatus;
    startTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    endTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    startDate: Date;
    endDate: Date;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    workflowInstanceId: number | null;
}>;
export declare function findLeaveRequestByFilter(params: LeaveRequestQuery, extraWhere?: Record<string, any>): Promise<{
    list: {
        createdAt: Date;
        id: number;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        employeeId: number;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.LeaveRequestStatus;
        startTime: import("@prisma/client").$Enums.LeaveTimeHalf;
        endTime: import("@prisma/client").$Enums.LeaveTimeHalf;
        startDate: Date;
        endDate: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        workflowInstanceId: number | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function findLeaveRequestById(id: number): Promise<{
    approvalChain: any;
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.LeaveType;
    reason: string;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.LeaveRequestStatus;
    startTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    endTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    startDate: Date;
    endDate: Date;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    workflowInstanceId: number | null;
}>;
export declare function updateLeaveRequest(id: number, data: LeaveRequestUpdate): Promise<{
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.LeaveType;
    reason: string;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.LeaveRequestStatus;
    startTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    endTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    startDate: Date;
    endDate: Date;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    workflowInstanceId: number | null;
}>;
export declare function approveLeaveRequest(id: number, data: LeaveApproval): Promise<any>;
export declare function rejectLeaveRequest(id: number, data: LeaveRejection): Promise<{
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.LeaveType;
    reason: string;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.LeaveRequestStatus;
    startTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    endTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    startDate: Date;
    endDate: Date;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    workflowInstanceId: number | null;
}>;
export declare function cancelLeaveRequest(id: number): Promise<{
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.LeaveType;
    reason: string;
    employeeId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.LeaveRequestStatus;
    startTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    endTime: import("@prisma/client").$Enums.LeaveTimeHalf;
    startDate: Date;
    endDate: Date;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    workflowInstanceId: number | null;
}>;
//# sourceMappingURL=leave-request.service.d.ts.map